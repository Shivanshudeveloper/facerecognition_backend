import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class HolidaysService {
    // private supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    constructor(private configService: ConfigService) { }
    private supabase = createClient(this.configService.get<string>('SUPABASE_URL'), this.configService.get<string>('SUPABASE_KEY'));

    async getAllHolidays(orgId: any): Promise<any> {
        const { data, error } = await this.supabase.from('add_holiday').select('*').eq('org_id', orgId);
        if (error) {
            throw error;
        }
        return data;
    }

    async createHoliday(body: any): Promise<any> {
        const { data, error } = await this.supabase
            .from('add_holiday')
            .insert([
                body
            ]);
        if (error) {
            throw error;
        }
    }
    async deleteHoliday(holidayId: any): Promise<any> {
        try {
            const { data, error } = await this.supabase.from('add_holiday').delete().eq('id', holidayId);
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

    async updateHoliday(holidayId: any, body: any): Promise<any> {
        try {
            const { data, error } = await this.supabase.from('add_holiday').update(body).eq('id', holidayId);
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
}
