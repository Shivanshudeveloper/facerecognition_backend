import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocationsService {
    // private supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    constructor(private configService: ConfigService) {}
    private supabase = createClient(this.configService.get<string>('SUPABASE_URL'),this.configService.get<string>('SUPABASE_KEY'));
    async getAllLocations(): Promise<any> {
        const {data,error} = await this.supabase.from('location').select('*');
        if(error){
            throw error;
        }
        return data;
    }
}
