require('dotenv').config();
import {User, UserServiceBindings} from '@loopback/authentication-jwt';
import {HiringSystemApplication} from './application';
import {AdministrationRepository, InterviewTimeSlotRepository, SectorRepository, SettingRepository} from './repositories';
import AdministrationSeed from './seeds/administration.json';
import InterviewTimingDummyData from './seeds/interverTiming.dummy.json';
import SectorSeed from './seeds/sector.json';
import SettingSeed from './seeds/setting.json';
import UserDummyData from './seeds/user.dummy.json';
import {UserService} from './services';

export async function migrate(args: string[]) {
  const existingSchema = args.includes('--rebuild') ? 'drop' : 'alter';
  console.log('Migrating schemas (%s existing schema)', existingSchema);

  const app = new HiringSystemApplication();
  await app.boot();
  await app.migrateSchema({existingSchema});

  if (args.includes('--populate')) {
    await populateSeeds(app);
  }

  if (args.includes('--dummy')) {
    await addDummyData(app);
  }

  // Connectors usually keep a pool of opened connections,
  // this keeps the process running even after all work is done.
  // We need to exit explicitly.
  process.exit(0);
}

migrate(process.argv).catch(err => {
  console.error('Cannot migrate database schema', err);
  process.exit(1);
});

export async function populateSeeds(app: HiringSystemApplication) {
  // Administration
  const administrationRepository = await app.getRepository(AdministrationRepository);
  await administrationRepository.deleteAll();
  const administrationRecords = await administrationRepository.createAll(AdministrationSeed);
  console.log(`Populated Administration with ${administrationRecords.length} records.`);

  // Sector
  const sectorRepository = await app.getRepository(SectorRepository);
  await sectorRepository.deleteAll();
  const sectorRecords = await sectorRepository.createAll(SectorSeed);
  console.log(`Populated Sector with ${sectorRecords.length} records.`);

  // Setting - We should insert only the records that doesn't exists already
  const settingRepository = await app.getRepository(SettingRepository);
  const settingRecord = [];
  for (let i = 0; i < SettingSeed.length; i++) {
    const {count} = await settingRepository.count({setting: SettingSeed[i].setting})
    if (!count) settingRecord.push(await settingRepository.create(SettingSeed[i]));
  }
  console.log(`Populated Setting with ${settingRecord.length} records.`);
}

export async function addDummyData(app: HiringSystemApplication) {
  // User
  const userService = await app.get(UserServiceBindings.USER_SERVICE) as UserService;
  const newUsers: Promise<User | null>[] = [];
  for (const user in UserDummyData) {
    newUsers.push(userService.createUser(UserDummyData[user]).catch(() => null));
  }
  const userRecords = await Promise.all(newUsers);
  console.log(`Populated User with ${userRecords?.filter(user => !!user).length} records.`);

  // Interview time slot
  const interviewTimingRepository = await app.getRepository(InterviewTimeSlotRepository);
  const interviewTimingRecords = await interviewTimingRepository.createAll(InterviewTimingDummyData);
  console.log(`Populated Interview Timing with ${interviewTimingRecords.length} records.`);
}
