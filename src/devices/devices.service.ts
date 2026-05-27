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

    private async syncDeviceToLocation(orgId: string, locationName: string, deviceName: string): Promise<void> {
        const { data: locRow } = await this.supabase
            .from('location_details')
            .select('devices')
            .eq('location', locationName)
            .eq('org_id', orgId)
            .single();
        let devices: string[] = [];
        if (locRow?.devices) {
            devices = typeof locRow.devices === 'string' ? JSON.parse(locRow.devices) : locRow.devices;
        }
        if (!devices.includes(deviceName)) {
            devices.push(deviceName);
        }
        await this.supabase.from('location_details').update({ devices: JSON.stringify(devices) }).eq('location', locationName).eq('org_id', orgId);
    }

    private async removeDeviceFromLocation(orgId: string, locationName: string, deviceName: string): Promise<void> {
        const { data: locRow } = await this.supabase
            .from('location_details')
            .select('devices')
            .eq('location', locationName)
            .eq('org_id', orgId)
            .single();
        if (!locRow?.devices) return;
        let devices: string[] = typeof locRow.devices === 'string' ? JSON.parse(locRow.devices) : locRow.devices;
        devices = devices.filter((d: string) => d !== deviceName);
        await this.supabase.from('location_details').update({ devices: JSON.stringify(devices) }).eq('location', locationName).eq('org_id', orgId);
    }

    async addDevice(body: any): Promise<any> {
        const { error } = await this.supabase.from('add_devices').insert([body]);
        if (error) {
            throw error;
        }
        if (body.location && body.org_id && body.device_name) {
            await this.syncDeviceToLocation(body.org_id, body.location, body.device_name);
        }
    }

    async deleteDevice(deviceId: any): Promise<any> {
        const { data: tempDevice } = await this.supabase.from('add_devices').select('device_name, location, org_id').eq('id', deviceId).single();
        const { data, error } = await this.supabase.from('add_devices').delete().eq('id', deviceId);
        if (error) {
            throw error;
        }
        if (tempDevice?.location && tempDevice?.org_id && tempDevice?.device_name) {
            await this.removeDeviceFromLocation(tempDevice.org_id, tempDevice.location, tempDevice.device_name);
        }
    }

    async updateDevice(deviceId: any, body: any): Promise<any> {
        const { data: oldDevice } = await this.supabase.from('add_devices').select('device_name, location, org_id').eq('id', deviceId).single();

        const { data, error } = await this.supabase.from('add_devices').update({
            device_name: body.device_name,
            device_emailId: body.device_emailId,
            location: body.location,
        }).eq('id', deviceId);
        if (error) {
            throw error;
        }

        const orgId = oldDevice?.org_id || body.org_id;
        if (orgId && oldDevice) {
            const locationChanged = oldDevice.location !== body.location;
            if (locationChanged) {
                if (oldDevice.location) {
                    await this.removeDeviceFromLocation(orgId, oldDevice.location, oldDevice.device_name);
                }
                if (body.location) {
                    await this.syncDeviceToLocation(orgId, body.location, body.device_name);
                }
            } else if (body.location && oldDevice.device_name !== body.device_name) {
                await this.removeDeviceFromLocation(orgId, body.location, oldDevice.device_name);
                await this.syncDeviceToLocation(orgId, body.location, body.device_name);
            }
        }

        return await this.getAllDevices(orgId);
    }

}
