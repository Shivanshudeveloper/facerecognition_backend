import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { fileUpload } from 'utils/file-upload';
// import { SUPABASE_KEY, SUPABASE_URL } from 'src/supabase.config';
@Injectable()
export class AnnouncementsService {
    constructor(private configService: ConfigService) { }
    // let SUPABASE_URL= 
    // let SUPABASE_KEY= this.configService.get<string>('DATABASE_URL');

    private supabase = createClient(this.configService.get<string>('SUPABASE_URL'), this.configService.get<string>('SUPABASE_KEY'));

    async getAllAnnouncements(orgId: any): Promise<any> {
        const { data, error } = await this.supabase.from('add_announcements').select('*').eq('org_id', orgId);
        if (error) {
            throw error;
        }
        return data;
    }

    async removeAnnouncement(id: any): Promise<any> {
        const { data, error } = await this.supabase.from('add_announcements').delete().eq('id', id);
        if (error) {
            throw error;
        }
        return data;
    }

    async updateAnnouncement(id: any, body: any, file: Express.Multer.File): Promise<any> {
        // Handle file storage to Supabase storage
        let filePublicUrl = null;
        if (file) {
            filePublicUrl = await fileUpload(file, 'announcement_attachments');
        }
        const { data, error } = await this.supabase.from('add_announcements').update({
            title: body.title,
            description: body.description,
            date: new Date(body.date).toLocaleDateString(),
            attached_file: filePublicUrl || null,
            group: body.groups,
        }).eq('id', id);
        if (error) {
            throw error;
        }
        return data;
    }

    async createAnnouncement(body: any, file: Express.Multer.File) {
        // Handle file storage to Supabase storage
        let filePublicUrl = null;
        if (file) {
            filePublicUrl = await fileUpload(file, 'announcement_attachments');
        }
        const { data, error } = await this.supabase.from('add_announcements').insert([
            {
                title: body.title,
                description: body.description,
                date: new Date(body.date).toLocaleDateString(),
                attached_file: filePublicUrl || null,
                group: body.groups,
                org_id: body.user_id,
            },
        ]);

        if (error) {
            console.log(error);
            throw error;
        }
    }
}

