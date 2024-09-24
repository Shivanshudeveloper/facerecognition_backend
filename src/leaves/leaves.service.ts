import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class LeavesService {
    constructor(private configService: ConfigService) {}
    private supabase = createClient(this.configService.get<string>('SUPABASE_URL'),this.configService.get<string>('SUPABASE_KEY'));
    async getAllLeaves(orgId:any): Promise<any> {
        const { data, error } = await this.supabase.from('leave').select('*').order('id', { ascending: false }).eq('org_id', orgId);
        if (error) {
            console.log(error);
            throw error;
        }
        // console.log(data);
        return data;
    }

    async approveLeave(leaveId: number): Promise<any> {
        const { data, error } = await this.supabase.from('leave').update({ status: 'Approved' }).match({ id: leaveId });
        if (error) {
            console.log(error);
            throw error;
        }
    }

    async rejectLeave(leaveId: number): Promise<any> {
        const { data, error } = await this.supabase.from('leave').update({ status: 'Rejected' }).match({ id: leaveId });
        if (error) {
            console.log(error);
            throw error;
        }
    }
}
