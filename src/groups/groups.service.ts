import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class GroupsService {
    constructor(private configService: ConfigService) { }
    private supabase = createClient(this.configService.get<string>('SUPABASE_URL'), this.configService.get<string>('SUPABASE_KEY'));
    async getAllGroups(orgId: any): Promise<any> {
        const { data, error } = await this.supabase.from('drawer_groupAdd').select('*').eq('org_id', orgId);
        if (error) {
            throw error;
        }
        return data;
    }
    async createGroup(body: any): Promise<any> {
        const { data, error } = await this.supabase.from('drawer_groupAdd').insert([body]);
        if (error) {
            throw error;
        }
        const allGroups = await this.getAllGroups(body.user_id);
        // console.log(allGroups);
        return allGroups;
    }

    async deleteGroup(groupId: any): Promise<any> {
        const { data: tempGroup, error: tempGroupError } = await this.supabase.from('drawer_groupAdd').select('*').eq('id', groupId);
        const { data, error } = await this.supabase.from('drawer_groupAdd').delete().match({ id: groupId });
        if (error) {
            throw error;
        }
        const orgId = tempGroup[0].org_id;
        const allGroups = await this.getAllGroups(orgId);
        return allGroups;
    }

    async updateGroup(groupId: any, body: any): Promise<any> {
        const { data, error } = await this.supabase.from('drawer_groupAdd').update(body).match({ id: groupId });
        if (error) {
            throw error;
        }
        // const {data:tempGroup,error:tempGroupError} = await this.supabase.from('drawer_groupAdd').select('*').eq('id',groupId);
        const orgId = body.user_id;
        const allGroups = await this.getAllGroups(orgId);
        return allGroups;
    }

    async getGroupByGroupNameAndOrgId(groupName: any, orgId: any): Promise<any> {
        const { data, error } = await this.supabase.from('drawer_groupAdd').select('*').eq('group_name', groupName).eq('org_id', orgId);
        if (error) {
            throw error;
        }
        return data
    }
}

