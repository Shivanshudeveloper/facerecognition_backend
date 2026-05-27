import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from 'utils/postmark-email-send';
import { ConfigService } from '@nestjs/config';
import { File } from 'buffer';
import { fileUpload } from 'utils/file-upload';
import { sendSMS } from 'utils/twilio-sms';
import { GroupsService } from 'src/groups/groups.service';

@Injectable()
export class MembersService {
    // private supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    constructor(private configService: ConfigService) { }
    private supabase = createClient(this.configService.get<string>('SUPABASE_URL'), this.configService.get<string>('SUPABASE_KEY'));
    async getAllMembers(orgId: any): Promise<any> {
        const { data, error } = await this.supabase.from('add_member').select('*').eq('org_id', orgId);
        if (error) throw error;

        const { data: embeddings } = await this.supabase
            .from('user_embeddings')
            .select('user_id, status, created_at, image_url1, image_url2, image_url3, image_url4')
            .eq('org_id', orgId)
            .order('id', { ascending: false });

        return (data || []).map(member => {
            const embedding = (embeddings || []).find(e => e.user_id === member.user_id);
            const faceImages = embedding
                ? [embedding.image_url1, embedding.image_url2, embedding.image_url3, embedding.image_url4].filter(Boolean)
                : [];
            return {
                ...member,
                face_setup_status: embedding?.status || 'Pending',
                face_setup_date: embedding?.created_at,
                face_images: faceImages,
            };
        });
    }

    async approveFaceSetup(userId: any): Promise<any> {
        const { error } = await this.supabase
            .from('user_embeddings')
            .update({ status: 'Approved' })
            .eq('user_id', userId);
        if (error) throw error;
    }

    async rejectFaceSetup(userId: any): Promise<any> {
        const { error } = await this.supabase
            .from('user_embeddings')
            .update({ status: 'Rejected' })
            .eq('user_id', userId);
        if (error) throw error;
    }

    async addMember(body: any, file: Express.Multer.File): Promise<any> {
        let publicUrl = null;
        if (file) {
            publicUrl = await fileUpload(file, 'member_image');
        }
        const { data, error } = await this.supabase
            .from('add_member')
            .insert([
                {
                    name: body.name,
                    mob_num: body.mob_num,
                    email_id: body.email_id,
                    onboard_status: body.onboard_status,
                    group_id: (body.group_id === 'null' || body.group_id === '') ? null : body.group_id,
                    member_image: publicUrl,
                    org_id: body.user_id,
                    user_id: body.member_id
                },
            ]);
        if (error) {
            throw error;
        }
        // updating total member count in group
        try {
            if (body.group_id) {
                const { data: groupData } = await this.supabase
                    .from('drawer_groupAdd').select('*').eq('id', body.group_id).single();
                if (groupData) {
                    const groupService = new GroupsService(this.configService);
                    await groupService.updateGroup(body.group_id, { total_member: (parseInt(groupData.total_member) + 1).toString() });
                }
            }
        }
        catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    async deleteMember(id: any): Promise<any> {
        const { data: tempMember, error: tempMemberError } = await this.supabase.from('add_member').select('*').eq('id', id);
        const { data, error } = await this.supabase.from('add_member').delete().eq('id', id);
        if (error) {
            throw error;
        }

        // updating total member count in group
        try {
            if (tempMember?.[0]?.group_id) {
                const { data: groupData } = await this.supabase
                    .from('drawer_groupAdd').select('*').eq('id', tempMember[0].group_id).single();
                if (groupData) {
                    const groupService = new GroupsService(this.configService);
                    await groupService.updateGroup(tempMember[0].group_id, { total_member: (parseInt(groupData.total_member) - 1).toString() });
                }
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    async sendMail(body: any): Promise<any> {
        const { data, error } = await this.supabase.from('add_member').select('*').eq('email_id', body.email_id);
        if (error) {
            throw error;
        }
        if (!data || data.length === 0) {
            throw new Error('Member not found');
        }
        await sendEmail(body.email_id, "test", `Hi ${data[0].name}`);
    }

    async sendSMS(body: any): Promise<any> {
        const { data, error } = await this.supabase.from('add_member').select('*').eq('mob_num', body.mob_num);
        if (error) {
            throw error;
        }
        if (data) {
            console.log(data);
            await sendSMS(
                this.configService.get<string>('TWILIO_ACCOUNT_SID'),
                this.configService.get<string>('TWILIO_AUTH_TOKEN'),
                this.configService.get<string>('TWILIO_PHONE_NUMBER'),
                "+" + body.mob_num,
                body.message
            );
        }
    }

    async updateMember(id: any, body: any, file: Express.Multer.File): Promise<any> {
        let updatedRecord = { ...body };

        // multipart/form-data sends null as the string "null" — convert to actual null
        Object.keys(updatedRecord).forEach(key => {
            if (updatedRecord[key] === 'null' || updatedRecord[key] === '') {
                updatedRecord[key] = null;
            }
        });

        if (file) {
            const publicUrl = await fileUpload(file, 'member_image');
            updatedRecord = {
                ...updatedRecord,
                member_image: publicUrl
            }
        }
        const { data: tempMember, error: tempMemberError } = await this.supabase.from('add_member').select('*').eq('id', id);
        const { data, error } = await this.supabase
            .from('add_member')
            .update(updatedRecord)
            .eq('id', id);
        if (error) {
            throw error;
        }

        try {
            const groupService = new GroupsService(this.configService);
            if (tempMember[0].group_id) {
                const { data: oldGroupData } = await this.supabase
                    .from('drawer_groupAdd').select('*').eq('id', tempMember[0].group_id).single();
                if (oldGroupData) {
                    await groupService.updateGroup(tempMember[0].group_id, { total_member: (parseInt(oldGroupData.total_member) - 1).toString() });
                }
            }
            if (body.group_id) {
                const { data: newGroupData } = await this.supabase
                    .from('drawer_groupAdd').select('*').eq('id', body.group_id).single();
                if (newGroupData) {
                    await groupService.updateGroup(body.group_id, { total_member: (parseInt(newGroupData.total_member) + 1).toString() });
                }
            }
        }
        catch (e) {
            console.log(e);
            throw new Error(e);
        }

    }

    async getShiftFromGroup(group: any): Promise<any> {
        const { data, error } = await this.supabase.from('work_shift').select('*').like('assigned_group', `%${group}%`);
        if (error) {
            throw error;
        }
        return data;
    }
}
