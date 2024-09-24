import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './members/members.module';
import { GroupsModule } from './groups/groups.module';
import { LocationsModule } from './locations/locations.module';
import { DevicesModule } from './devices/devices.module';
import { LeavesModule } from './leaves/leaves.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { HolidaysModule } from './holidays/holidays.module';
import { WorkShiftsModule } from './work-shifts/work-shifts.module';
import { OrganizationModule } from './organization/organization.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [UserModule, AuthModule, MembersModule, GroupsModule, LocationsModule, DevicesModule, LeavesModule, AttendanceModule, AnnouncementsModule, HolidaysModule, WorkShiftsModule, OrganizationModule,ConfigModule.forRoot({
    isGlobal:true
  })],
  controllers: [],
  providers: [],
})
export class AppModule {}
