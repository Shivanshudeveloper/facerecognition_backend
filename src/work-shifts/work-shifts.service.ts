import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class WorkShiftsService {
    // private supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    constructor(private configService: ConfigService) { }
    private supabase = createClient(this.configService.get<string>('SUPABASE_URL'), this.configService.get<string>('SUPABASE_KEY'));
    async getAllWorkShifts(orgId: any): Promise<any> {
        try {
            const { data, error } = await this.supabase.from('work_shift').select('*').eq('org_id', orgId);
            if (error) {
                throw new Error(error.message);
            }
            return {
                success: true,
                data
            }
        } catch (error) {
            return {
                success: false,
                error
            }
        }
    }

    async addNewWorkShift(body: any): Promise<any> {
        try {
            const { data, error } = await this.supabase.from('work_shift').insert([body]);
            if (error) {
                throw new Error(error.message);
            }
            return {
                success: true,
                data
            }
        } catch (error) {
            return {
                success: false,
                error
            }
        }
    }

    async deleteWorkShift(workShiftId: any, orgId: any): Promise<any> {
        try {
            await this.supabase.from('drawer_groupAdd').update({ shift_id: null }).eq('org_id', orgId).eq('shift_id', workShiftId);
            const { data, error } = await this.supabase.from('work_shift').delete().eq('id', workShiftId);
            if (error) {
                throw new Error(error.message);
            }
            return { success: true, data };
        } catch (error) {
            return { success: false, error };
        }
    }

    async updateWorkShift(workShiftId: any, body: any): Promise<any> {
        try {
            const { data, error } = await this.supabase.from('work_shift').update(body).eq('id', workShiftId);
            if (error) {
                throw new Error(error.message);
            }
            return {
                success: true,
                data
            }
        } catch (error) {
            return {
                success: false,
                error
            }
        }
    }

    async assignGroupsToWorkShift(workShiftId: any, body: any): Promise<any> {
        try {
            const orgId = body.org_id;
            // Clear existing group assignments for this shift
            await this.supabase.from('drawer_groupAdd').update({ shift_id: null }).eq('org_id', orgId).eq('shift_id', workShiftId);

            // Assign selected groups by setting shift_id on each group row
            const groupNames: string[] = Array.isArray(body.groups)
                ? body.groups
                : String(body.groups).split(',').map((g: string) => g.trim()).filter(Boolean);

            for (const groupName of groupNames) {
                await this.supabase
                    .from('drawer_groupAdd')
                    .update({ shift_id: workShiftId })
                    .eq('group_name', groupName)
                    .eq('org_id', orgId);
            }

            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    }


}
