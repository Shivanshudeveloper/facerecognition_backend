import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class HolidaysService {
    // private supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    constructor(private configService: ConfigService) { }
    private supabase = createClient(this.configService.get<string>('SUPABASE_URL'), this.configService.get<string>('SUPABASE_KEY'));

    async getAllHolidays(orgId: any): Promise<any> {
        const { data, error } = await this.supabase
            .from('add_holiday')
            .select('*, holiday_groups(group_id)')
            .eq('org_id', orgId);
        if (error) {
            throw error;
        }
        return data;
    }

    async createHoliday(body: any): Promise<any> {
        const { holiday_name, holiday_date, holiday_description, org_id, groups } = body;
        const { data: insertedRow, error } = await this.supabase
            .from('add_holiday')
            .insert([{ holiday_name, holiday_date, holiday_description, org_id }])
            .select()
            .single();
        if (error) {
            throw error;
        }
        if (groups && insertedRow?.id) {
            const groupIds: string[] = Array.isArray(groups) ? groups : String(groups).split(',').map((g: string) => g.trim()).filter(Boolean);
            for (const groupId of groupIds) {
                await this.supabase.from('holiday_groups').insert({ holiday_id: insertedRow.id, group_id: groupId });
            }
        }
        return { success: true, data: insertedRow };
    }

    async deleteHoliday(holidayId: any): Promise<any> {
        try {
            await this.supabase.from('holiday_groups').delete().eq('holiday_id', holidayId);
            const { data, error } = await this.supabase.from('add_holiday').delete().eq('id', holidayId);
            if (error) {
                throw new Error(error.message);
            }
            return { success: true, data };
        } catch (error) {
            return { success: false, error };
        }
    }

    async updateHoliday(holidayId: any, body: any): Promise<any> {
        try {
            const { groups, ...holidayFields } = body;
            const { data, error } = await this.supabase.from('add_holiday').update(holidayFields).eq('id', holidayId);
            if (error) {
                throw new Error(error.message);
            }
            await this.supabase.from('holiday_groups').delete().eq('holiday_id', holidayId);
            if (groups) {
                const groupIds: string[] = Array.isArray(groups) ? groups : String(groups).split(',').map((g: string) => g.trim()).filter(Boolean);
                for (const groupId of groupIds) {
                    await this.supabase.from('holiday_groups').insert({ holiday_id: holidayId, group_id: groupId });
                }
            }
            return { success: true, data };
        } catch (error) {
            return { success: false, error };
        }
    }
}
