import { Injectable, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(private configService: ConfigService) {}
  private supabase = createClient(
    this.configService.get<string>('SUPABASE_URL'),
    this.configService.get<string>('SUPABASE_KEY'),
  );

  private async fetchMemberMap(orgId: string): Promise<Map<string, any>> {
    const { data: members, error } = await this.supabase
      .from('add_member')
      .select('user_id, name, member_image, group_id, email_id')
      .eq('org_id', orgId);

    if (error) {
      this.logger.warn(`fetchMemberMap failed for orgId=${orgId}: ${error.message}`);
      return new Map();
    }

    this.logger.log(`fetchMemberMap raw rows for orgId=${orgId}: ${JSON.stringify((members ?? []).map(m => ({ user_id: m.user_id, name: m.name, email_id: m.email_id })))}`);

    const map = new Map<string, any>();
    for (const m of members ?? []) {
      if (m.user_id) map.set(String(m.user_id), m);
    }
    this.logger.log(`fetchMemberMap: loaded ${map.size} members with user_id for orgId=${orgId}, map keys=${JSON.stringify([...map.keys()])}`);
    return map;
  }

  private async resolveName(userId: string, memberMap: Map<string, any>, orgId: string): Promise<{ name: string; member_image: string | null; assign_group: string | null }> {
    const member = memberMap.get(String(userId));
    if (member?.name) {
      return { name: member.name, member_image: member.member_image ?? null, assign_group: member.group_id ?? null };
    }

    this.logger.warn(`resolveName: userId=${userId} not in memberMap (size=${memberMap.size}), trying auth+email fallback`);

    // Fall back: look up via Supabase auth email → add_member.email_id
    try {
      const { data: authData, error: authError } = await this.supabase.auth.admin.getUserById(userId);
      if (authError) this.logger.warn(`resolveName: auth.admin.getUserById error: ${authError.message}`);
      const email = authData?.user?.email;
      this.logger.warn(`resolveName: auth email for userId=${userId} → ${email ?? 'null'}`);
      if (email) {
        const { data: emailRows, error: emailError } = await this.supabase
          .from('add_member')
          .select('name, member_image, group_id')
          .eq('email_id', email)
          .eq('org_id', orgId)
          .limit(1);
        if (emailError) this.logger.warn(`resolveName: email lookup error: ${emailError.message}`);
        const byEmail = emailRows?.[0] ?? null;
        this.logger.warn(`resolveName: email lookup for ${email} → ${JSON.stringify(byEmail)}`);
        if (byEmail?.name) {
          memberMap.set(String(userId), byEmail);
          return { name: byEmail.name, member_image: byEmail.member_image ?? null, assign_group: byEmail.group_id ?? null };
        }
      }
    } catch (e) {
      this.logger.warn(`resolveName: auth lookup threw for userId=${userId}: ${e}`);
    }

    this.logger.warn(`resolveName: FAILED to resolve name for userId=${userId}, orgId=${orgId} — returning raw userId`);
    return { name: userId, member_image: null, assign_group: null };
  }

  private async resolveOrganizationIds(inputId: any): Promise<string[]> {
    const requestedId = String(inputId);
    const { data, error } = await this.supabase
      .from('organization_profile')
      .select('id,user_id')
      .eq('user_id', requestedId)
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Failed to resolve organization id for userId=${requestedId}`,
        error.message,
      );
      throw error;
    }

    if (!data?.id) {
      this.logger.warn(
        `No organization_profile found for userId=${requestedId}; using incoming id as org_id`,
      );
      return [requestedId];
    }

    this.logger.log(
      `Resolved userId=${requestedId} to organization_profile.id=${data.id}`,
    );
    return [...new Set([String(data.id), requestedId])];
  }

  private logRecentTimeRowsForDebug(rows: any[], context: string) {
    const sample = rows.slice(0, 5).map((row) => ({
      id: row.id,
      org_id: row.org_id,
      user_Id: row.user_Id,
      date: row.date,
      created_at: row.created_at,
      keys: Object.keys(row),
    }));

    this.logger.warn(
      `${context}: recent time row sample=${JSON.stringify(sample)}`,
    );
  }

  private async logTimeRowsWhenEmpty(context: string) {
    const { data, error } = await this.supabase
      .from('time')
      .select('*')
      .order('id', { ascending: false })
      .limit(5);

    if (error) {
      this.logger.error(
        `${context}: failed to fetch recent time rows`,
        error.message,
      );
      return;
    }

    this.logRecentTimeRowsForDebug(data ?? [], context);
  }

  async getAllAttendance(orgId: any): Promise<any> {
    await this.resolveOrganizationIds(orgId);
    this.logger.log(
      `getAllAttendance started inputId=${orgId}; filtering time.org_id=${orgId}`,
    );

    // Fetch data from the first table
    const { data: table1Data, error: table1Error } = await this.supabase
      .from('time')
      .select('*')
      .order('id', { ascending: false })
      .eq('org_id', orgId);
    if (table1Error) {
      this.logger.error(
        `Failed to fetch time rows for inputId=${orgId}`,
        table1Error.message,
      );
      throw table1Error;
    }
    const attendanceRows = table1Data ?? [];
    this.logger.log(
      `Fetched ${attendanceRows.length} attendance rows from time for inputId=${orgId}`,
    );
    if (attendanceRows.length === 0) {
      await this.logTimeRowsWhenEmpty(
        `No attendance rows matched inputId=${orgId}, time.org_id=${orgId}`,
      );
    }

    // Fetch data from the second table
    const { data: table2Data, error: table2Error } = await this.supabase
      .from('add_member')
      .select('*')
      .order('id', { ascending: false })
      .eq('org_id', orgId);

    if (table2Error) {
      this.logger.error(
        `Failed to fetch members for inputId=${orgId}`,
        table2Error.message,
      );
      throw table2Error;
    }
    const memberRows = table2Data ?? [];
    this.logger.log(
      `Fetched ${memberRows.length} member rows from add_member for inputId=${orgId}`,
    );

    const membersByUserId = new Map(
      memberRows.map((member) => [String(member.user_id), member]),
    );

    const joinedData = attendanceRows.map((attendance) => {
      const userId = String(attendance.user_Id);
      const member = membersByUserId.get(userId);

      if (!member) {
        this.logger.warn(
          `No add_member match found for attendance id=${attendance.id}, user_Id=${attendance.user_Id}, inputId=${orgId}, attendanceOrgId=${attendance.org_id}`,
        );
      }

      return {
        ...(member ?? {}),
        ...attendance,
        assign_group: member?.assign_group ?? attendance.assign_group ?? '',
        group: member?.assign_group ?? attendance.group ?? '',
        name:
          member?.name ?? attendance.name ?? attendance.user_Id ?? 'Unknown',
      };
    });

    this.logger.log(
      `Returning ${joinedData.length} attendance rows for inputId=${orgId}`,
    );
    return joinedData;
  }

  async getTodaysPresentMembers(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    this.logger.log(`getTodaysPresentMembers started date=${today}`);

    const { data, error } = await this.supabase
      .from('time')
      .select('*')
      .eq('date', today);
    if (error) {
      this.logger.error(
        `Failed to fetch today's present members for date=${today}`,
        error.message,
      );
      throw error;
    }
    this.logger.log(
      `Returning ${data?.length ?? 0} present member rows for date=${today}`,
    );
    return data;
  }

  async getAttendanceWeeklyReport(orgId: any, body: any): Promise<any> {
    await this.resolveOrganizationIds(orgId);
    const endDate = new Date(body.date);
    const startDate = new Date(endDate);
    this.logger.log(
      `getAttendanceWeeklyReport started inputId=${orgId}; filtering time.org_id=${orgId}, body=${JSON.stringify(body)}`,
    );
    if (body.range === 'week') {
      startDate.setDate(startDate.getDate() - 6);
    } else if (body.range === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    }
    const datesArray = [];
    const tempDate = new Date(startDate);
    while (tempDate <= endDate) {
      datesArray.push(tempDate.toISOString().split('T')[0]);
      tempDate.setDate(tempDate.getDate() + 1);
    }
    // datesArray.push(tempDate.toISOString().split('T')[0]);
    // console.log(datesArray);
    // console.log(startDate);
    // console.log(endDate);
    const { data, error } = await this.supabase
      .from('time')
      .select('*')
      .eq('org_id', orgId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });
    if (error) {
      this.logger.error(
        `Failed to fetch attendance report inputId=${orgId}, startDate=${startDate.toISOString().split('T')[0]}, endDate=${endDate.toISOString().split('T')[0]}`,
        error.message,
      );
      throw error;
    }
    this.logger.log(
      `Fetched ${data?.length ?? 0} attendance report rows for inputId=${orgId}`,
    );
    if ((data?.length ?? 0) === 0) {
      await this.logTimeRowsWhenEmpty(
        `No attendance report rows matched inputId=${orgId}, time.org_id=${orgId}`,
      );
    }
    const memberMap = await this.fetchMemberMap(String(orgId));
    const groupedData = {};
    for (let i = 0; i < data.length; i++) {
      if (!groupedData[data[i].user_Id]) {
        const resolved = await this.resolveName(data[i].user_Id, memberMap, String(orgId));
        const userData = {
          ...data[i],
          group: resolved.assign_group ?? data[i].group ?? '',
          name: resolved.name,
          profile_image_url: resolved.member_image ?? null,
        };
        groupedData[data[i].user_Id] = { user: userData };
        datesArray.forEach((date: any) => {
          groupedData[data[i].user_Id][date] = null;
        });
      }
      groupedData[data[i].user_Id][data[i].date] = data[i];
    }
    this.logger.log(
      `Returning attendance report for ${Object.keys(groupedData).length} users inputId=${orgId}`,
    );
    return groupedData;
  }

  async getAttendanceMonthlyReport(orgId: any, body: any): Promise<any> {
    await this.resolveOrganizationIds(orgId);
    const endDate = new Date(body.date);
    const startDate = new Date(endDate);
    this.logger.log(
      `getAttendanceMonthlyReport started inputId=${orgId}; filtering time.org_id=${orgId}, body=${JSON.stringify(body)}`,
    );
    startDate.setMonth(startDate.getMonth() - 1);
    const datesArray = [];
    const tempDate = new Date(startDate);
    while (tempDate <= endDate) {
      datesArray.push(tempDate.toISOString().split('T')[0]);
      tempDate.setDate(tempDate.getDate() + 1);
    }
    // console.log(datesArray);
    // console.log(startDate);
    // console.log(endDate);
    const { data, error } = await this.supabase
      .from('time')
      .select('*')
      .eq('org_id', orgId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });
    if (error) {
      this.logger.error(
        `Failed to fetch monthly attendance report inputId=${orgId}, startDate=${startDate.toISOString().split('T')[0]}, endDate=${endDate.toISOString().split('T')[0]}`,
        error.message,
      );
      throw error;
    }
    this.logger.log(
      `Fetched ${data?.length ?? 0} monthly attendance rows for inputId=${orgId}`,
    );
    if ((data?.length ?? 0) === 0) {
      await this.logTimeRowsWhenEmpty(
        `No monthly attendance rows matched inputId=${orgId}, time.org_id=${orgId}`,
      );
    }
    const memberMap = await this.fetchMemberMap(String(orgId));
    const groupedData = {};
    for (let i = 0; i < data.length; i++) {
      if (!groupedData[data[i].user_Id]) {
        const resolved = await this.resolveName(data[i].user_Id, memberMap, String(orgId));
        const userData = {
          ...data[i],
          group: resolved.assign_group ?? data[i].group ?? '',
          name: resolved.name,
          profile_image_url: resolved.member_image ?? null,
        };
        groupedData[data[i].user_Id] = { user: userData };
        datesArray.forEach((date: any) => {
          groupedData[data[i].user_Id][date] = null;
        });
      }
      groupedData[data[i].user_Id][data[i].date] = data[i];
    }
    this.logger.log(
      `Returning monthly attendance report for ${Object.keys(groupedData).length} users inputId=${orgId}`,
    );
    return groupedData;
  }

  async getOvertimeDailyReport(orgId: any, body: any): Promise<any> {
    await this.resolveOrganizationIds(orgId);
    const dateStr = new Date(body.date).toISOString().split('T')[0];
    this.logger.log(
      `getOvertimeDailyReport started inputId=${orgId}; filtering time.org_id=${orgId}, date=${dateStr}`,
    );
    const { data, error } = await this.supabase
      .from('time')
      .select('*')
      .eq('org_id', orgId)
      .eq('date', dateStr);
    if (error) {
      this.logger.error(
        `Failed to fetch overtime daily report inputId=${orgId}, date=${dateStr}`,
        error.message,
      );
      throw error;
    }
    this.logger.log(
      `Fetched ${data?.length ?? 0} overtime daily rows for inputId=${orgId}, date=${dateStr}`,
    );
    if ((data?.length ?? 0) === 0) {
      await this.logTimeRowsWhenEmpty(
        `No overtime daily rows matched inputId=${orgId}, time.org_id=${orgId}, date=${dateStr}`,
      );
    }
    const memberMap = await this.fetchMemberMap(String(orgId));
    for (let i = 0; i < data.length; i++) {
      const resolved = await this.resolveName(data[i].user_Id, memberMap, String(orgId));
      data[i] = {
        ...data[i],
        group: resolved.assign_group ?? data[i].group ?? '',
        name: resolved.name,
        profile_image_url: resolved.member_image ?? null,
      };
    }
    this.logger.log(
      `Returning ${data?.length ?? 0} overtime daily rows for inputId=${orgId}, date=${dateStr}`,
    );

    return data;
  }

  async getOvertimeReport(orgId: any, body: any): Promise<any> {
    await this.resolveOrganizationIds(orgId);
    const endDate = new Date(body.date);
    const startDate = new Date(endDate);
    this.logger.log(
      `getOvertimeReport started inputId=${orgId}; filtering time.org_id=${orgId}, body=${JSON.stringify(body)}`,
    );
    if (body.range === 'week') startDate.setDate(startDate.getDate() - 6);
    else if (body.range === 'month')
      startDate.setMonth(startDate.getMonth() - 1);
    const datesArray = [];
    const tempDate = new Date(startDate);
    while (tempDate <= endDate) {
      datesArray.push(tempDate.toISOString().split('T')[0]);
      tempDate.setDate(tempDate.getDate() + 1);
    }
    const { data, error } = await this.supabase
      .from('time')
      .select('*')
      .eq('org_id', orgId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });
    if (error) {
      this.logger.error(
        `Failed to fetch overtime report inputId=${orgId}, startDate=${startDate.toISOString().split('T')[0]}, endDate=${endDate.toISOString().split('T')[0]}`,
        error.message,
      );
      throw error;
    }
    this.logger.log(
      `Fetched ${data?.length ?? 0} overtime report rows for inputId=${orgId}`,
    );
    if ((data?.length ?? 0) === 0) {
      await this.logTimeRowsWhenEmpty(
        `No overtime report rows matched inputId=${orgId}, time.org_id=${orgId}`,
      );
    }
    const memberMap = await this.fetchMemberMap(String(orgId));
    const groupedData = {};
    for (let i = 0; i < data.length; i++) {
      if (!groupedData[data[i].user_Id]) {
        const resolved = await this.resolveName(data[i].user_Id, memberMap, String(orgId));
        const userData = {
          ...data[i],
          group: resolved.assign_group ?? data[i].group ?? '',
          name: resolved.name,
          profile_image_url: resolved.member_image ?? null,
        };
        groupedData[data[i].user_Id] = { user: userData };
        datesArray.forEach((date: any) => {
          groupedData[data[i].user_Id][date] = null;
        });
      }
      groupedData[data[i].user_Id][data[i].date] = data[i];
    }
    this.logger.log(
      `Returning overtime report for ${Object.keys(groupedData).length} users inputId=${orgId}`,
    );
    return groupedData;
  }
}
