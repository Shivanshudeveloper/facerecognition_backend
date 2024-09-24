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
        if (error) {
            throw error;
        }
        // console.log(data);
        return data;
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
                    assign_group: body.assign_group,
                    member_image: publicUrl,
                    org_id: body.user_id,
                    user_id:body.member_id
                },
            ]);
        if (error) {
            throw error;
        }
        // updating total member count in group
        try {
            if(body.assign_group){
                const groupService = new GroupsService(this.configService)
                const oldGroup = await groupService.getGroupByGroupNameAndOrgId(body.assign_group, body.user_id)
                await groupService.updateGroup(oldGroup[0]?.id, { total_member: (parseInt(oldGroup[0].total_member) + 1).toString() })
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
            const groupService = new GroupsService(this.configService)
            const oldGroup = await groupService.getGroupByGroupNameAndOrgId(tempMember[0].assign_group, tempMember[0].org_id)
            await groupService.updateGroup(oldGroup[0].id, { total_member: (parseInt(oldGroup[0].total_member) - 1).toString() })
        }
        catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    async sendMail(body: any): Promise<any> {
        const { data, error } = await this.supabase.from('add_member').select('*').eq('email_id', body.email_id);
        if (error) {
            throw error;
        }
        if (data) {
            console.log(data);
            await sendEmail(body.email_id, "test", `Hi ${data[0].name}`);
        }
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
        let updatedRecord = {
            ...body
        }
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
            const groupService = new GroupsService(this.configService)
            const oldGroup = await groupService.getGroupByGroupNameAndOrgId(tempMember[0].assign_group, tempMember[0].org_id)
            if(oldGroup[0]){
                await groupService.updateGroup(oldGroup[0].id, { total_member: (parseInt(oldGroup[0].total_member) - 1).toString() })
            }
            const newGroup = await groupService.getGroupByGroupNameAndOrgId(body.assign_group, tempMember[0].org_id)
            if(newGroup[0]){
                await groupService.updateGroup(newGroup[0].id, { total_member: (parseInt(newGroup[0].total_member) + 1).toString() })
            }
            // await groupService.updateGroup(newGroup[0].id, { total_member: (parseInt(newGroup[0].total_member) + 1).toString() })
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
