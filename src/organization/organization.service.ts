import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { getGMTOffset } from 'utils/utils';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class OrganizationService {
    // private supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    constructor(private configService: ConfigService) {}
    private supabase = createClient(this.configService.get<string>('SUPABASE_URL'),this.configService.get<string>('SUPABASE_KEY'));
    async getOrganization(email: string) {
        // const { data, error } = await this.supabase.from('organizationRegister').select('*').eq('email', email);
        const { data, error } = await this.supabase.from('organization_profile').select('*').eq('com_email', email);
        if (error) {
            throw error;
        }
        console.log(data);
        
        return data;
    }

    async getOrganizationProfile(user_id: string) {
        const { data, error } = await this.supabase.from('organization_profile').select('*').eq('user_id', user_id);
        if (error) {
            throw error;
        }
        // console.log(data);
        
        return data;
    }

    async createOrganization(body: any) {
        const {user_id,website,org_image_url,language,email,organizationName,industryType,businessSize} = body;
        let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let gmtOffset = getGMTOffset();
        let time_zone = `${timeZone} ${gmtOffset}`
        const { error:org_reg_err } = await this.supabase.from('organizationRegister').insert([{
            organizationName,
            industryType,
            businessSize,
            email,
        }]);
        if (org_reg_err) {
            throw org_reg_err;
        }

        const { error:org_prof_err } = await this.supabase.from('organization_profile').insert([{
            user_id,
            website,
            org_image_url,
            language,
            time_zone, 
            com_email:email,
            company_name:organizationName,
            industry_type:industryType,
            business_size:businessSize
        }]);

        if (org_prof_err) {
            throw org_prof_err;
        }
    }

    async updateOrganization(org_id: string, body: any) {
        const { data, error } = await this.supabase.from('organization_profile').update({...body}).eq('user_id', org_id);
        if (error) {
            throw error;
        }
        const {data:updatedOrganization} = await this.supabase.from('organization_profile').select('*').eq('user_id', org_id);
        return updatedOrganization;
    }
   
}
