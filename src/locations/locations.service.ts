import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocationsService {
    constructor(private configService: ConfigService) {}
    private supabase = createClient(this.configService.get<string>('SUPABASE_URL'),this.configService.get<string>('SUPABASE_KEY'));

    async getAllLocations(orgId: string): Promise<any> {
        const { data, error } = await this.supabase
            .from('location_details')
            .select('*')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    async addLocation(body: any): Promise<any> {
        const { data, error } = await this.supabase.from('location_details').insert([{
            location: body.location,
            latitude: body.latitude,
            longitude: body.longitude,
            org_id: body.org_id,
        }]);
        if (error) throw error;
        return data;
    }

    async deleteLocation(locationId: string): Promise<any> {
        const { data, error } = await this.supabase.from('location_details').delete().eq('id', locationId);
        if (error) throw error;
        return data;
    }

    async updateLocation(locationId: string, body: any): Promise<any> {
        const { data, error } = await this.supabase.from('location_details').update({
            location: body.location,
            latitude: body.latitude,
            longitude: body.longitude,
        }).eq('id', locationId);
        if (error) throw error;
        return data;
    }
}
