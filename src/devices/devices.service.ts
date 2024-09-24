import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class DevicesService {
    // private supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    constructor(private configService: ConfigService) { }
    private supabase = createClient(this.configService.get<string>('SUPABASE_URL'), this.configService.get<string>('SUPABASE_KEY'));
    async getAllDevices(orgId: any): Promise<any> {
        const { data, error } = await this.supabase.from('add_devices').select('*').order('id', { ascending: false }).eq('org_id', orgId);
        if (error) {
            throw error;
        }
        // console.log(data);
        return data;
    }

    async addDevice(body: any): Promise<any> {
        const { error } = await this.supabase.from('add_devices').insert([body]);
        if (error) {
            throw error;
        }
    }

    async deleteDevice(deviceId: any): Promise<any> {
        // const {data:tempDevice,error:tempDeviceError} = await this.supabase.from('add_devices').select('*').eq('id',deviceId);
        const { data, error } = await this.supabase.from('add_devices').delete().match({ id: deviceId });
        if (error) {
            throw error;
        }
        // const orgId = tempDevice[0].user_id;
        // const allDevices = await this.getAllDevices(orgId);
        // return allDevices;
    }

    async updateDevice(deviceId: any, body: any): Promise<any> {
        const { data, error } = await this.supabase.from('add_devices').update({
            device_name: body.device_name,
            device_emailId: body.device_emailId,
            location: body.location,
        }).match({ id: deviceId });
        if (error) {
            throw error;
        }
        const orgId = body.user_id;
        const allDevices = await this.getAllDevices(orgId);
        return allDevices;
    }

}
