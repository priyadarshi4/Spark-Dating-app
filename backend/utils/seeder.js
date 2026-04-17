require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../models/User');

// ── Realistic Indian name pools ───────────────────────────────
const maleNames = [
  'Aarav Shah', 'Virat Sharma', 'Arjun Mehta', 'Rohan Gupta', 'Kabir Singh',
  'Dev Patel', 'Aditya Kumar', 'Karan Malhotra', 'Rahul Verma', 'Ishaan Joshi',
  'Siddharth Rao', 'Nikhil Nair', 'Aryan Kapoor', 'Dhruv Pandey', 'Veer Mishra',
  'Rishi Agarwal', 'Samar Chopra', 'Yash Bajaj', 'Neil Saxena', 'Om Tiwari',
  'Pranav Reddy', 'Tushar Iyer', 'Harsh Bhatia', 'Ayaan Khan', 'Shiv Choudhary',
  'Akash Dubey', 'Kunal Sinha', 'Tarun Pillai', 'Manav Desai', 'Shreyas Patil',
  'Ansh Rajput', 'Vivek Thakur', 'Arnav Bhatt', 'Ishan Chandra', 'Mohit Bansal',
  'Naman Goel', 'Parth Rastogi', 'Raj Menon', 'Sajan Ghosh', 'Uday Mathur',
];

const femaleNames = [
  'Ananya Singh', 'Priya Sharma', 'Kavya Patel', 'Meera Kapoor', 'Riya Gupta',
  'Aisha Khan', 'Diya Mehta', 'Pooja Nair', 'Shreya Joshi', 'Nisha Verma',
  'Tanvi Rao', 'Kritika Malhotra', 'Ishita Kumar', 'Sanya Agarwal', 'Tara Chopra',
  'Avni Bajaj', 'Rhea Saxena', 'Palak Tiwari', 'Aditi Reddy', 'Zara Iyer',
  'Simran Bhatia', 'Natasha Pandey', 'Divya Mishra', 'Komal Choudhary', 'Mansi Dubey',
  'Neha Sinha', 'Pari Pillai', 'Ritika Desai', 'Sneha Patil', 'Trisha Rajput',
  'Uma Thakur', 'Vandana Bhatt', 'Yashika Chandra', 'Zoya Bansal', 'Aarohi Goel',
  'Bhavya Rastogi', 'Charu Menon', 'Diksha Ghosh', 'Eva Mathur', 'Falak Singh',
];

const otherNames = [
  'Alex Sharma', 'River Patel', 'Quinn Singh', 'Sage Kumar', 'Sky Mehta',
  'Jordan Nair', 'Avery Joshi', 'Casey Verma', 'Morgan Rao', 'Rowan Gupta',
  'Phoenix Kapoor', 'Blake Malhotra', 'Cameron Agarwal', 'Drew Chopra',
  'Emery Bajaj', 'Finley Saxena', 'Grey Tiwari', 'Harper Reddy',
  'Indigo Iyer', 'Jamie Bhatia',
];

// ── Content pools ─────────────────────────────────────────────
const bios = [
  "Coffee addict, sunrise chaser, and terrible at cooking but great at ordering in. Looking for someone to explore the city with ☕",
  "Bookworm by day, amateur chef by night. If you can recommend a good book or a hidden restaurant, we'll get along great 📚",
  "Gym rat who secretly cries at rom-coms. Looking for someone real in a world full of filters 💪",
  "Software engineer who still gets lost using GPS. Passionate about music, hiking, and finding the best chai in the city 🎵",
  "Dancer, dog mom, and aspiring travel blogger. My love language is quality time and homemade food 🐶",
  "Architecture nerd with a photography obsession. Searching for a partner in crime for weekend adventures ✈️",
  "Yoga teacher who loves heavy metal music — yes, both can coexist. Looking for someone who surprises me 🧘",
  "Foodie who judges restaurants by their dessert menu first. Let's talk movies, travel, and life at 2am 🎬",
  "Startup founder by day, tabla player by night. Looking for genuine connections, not small talk 🥁",
  "Marine biologist obsessed with ocean documentaries. Will definitely make you watch them too 🌊",
  "Theatre kid turned corporate — still dramatic though. Looking for someone who can match my energy 🎭",
  "Night owl who makes excellent pancakes. My friends say I give the best advice. Let's find out 🥞",
  "Minimalist with a maximal personality. Into philosophy, street food, and long evening walks 🌙",
  "Vet student who talks to animals more than humans. Seeking someone who gets that 🐾",
  "Amateur stand-up comedian — I promise I'm funnier in person. Looking for my best friend first ✨",
];

const occupations = [
  'Software Engineer', 'UX Designer', 'Doctor', 'Marketing Manager',
  'Architect', 'Journalist', 'Chef', 'Lawyer', 'Teacher', 'Data Scientist',
  'Product Manager', 'Photographer', 'CA', 'Nurse', 'Content Creator',
  'Financial Analyst', 'Graphic Designer', 'Entrepreneur', 'Researcher', 'Musician',
];

const educations = [
  'IIT Delhi', 'IIM Ahmedabad', 'BITS Pilani', 'Delhi University',
  'Mumbai University', 'Symbiosis', 'Christ University', 'VIT',
  "St. Xavier's College", 'Jadavpur University',
];

const interestPool = [
  'Music', 'Travel', 'Fitness', 'Cooking', 'Art', 'Gaming', 'Reading',
  'Movies', 'Dance', 'Photography', 'Yoga', 'Hiking', 'Coffee', 'Wine',
  'Dogs', 'Cats', 'Sports', 'Tech', 'Fashion', 'Food', 'Theater',
  'Guitar', 'Nature', 'Writing', 'Singing',
];

const relationshipGoals = ['relationship', 'casual', 'friendship', 'figuring_out', 'marriage'];

// ── Helpers ───────────────────────────────────────────────────
const sample  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
const pickInterests = () => shuffle([...interestPool]).slice(0, randInt(3, 9));

// Delhi-area coordinates with slight scatter
const randCoords = () => [
  parseFloat((77.209 + (Math.random() - 0.5) * 1.2).toFixed(5)),
  parseFloat((28.614 + (Math.random() - 0.5) * 1.2).toFixed(5)),
];

const cities = ['New Delhi', 'Gurgaon', 'Noida', 'Faridabad', 'Ghaziabad'];

// ── Build one user object ─────────────────────────────────────
function buildUser(name, gender, index) {
  const age = randInt(21, 34);
  return {
    name,
    email:    `spark_seed_${gender}_${index}@spark-seed.com`,
    password: 'Password123!',
    age,
    gender,
    bio:          sample(bios),
    occupation:   sample(occupations),
    education:    sample(educations),
    height:       gender === 'male' ? randInt(168, 188) : gender === 'female' ? randInt(155, 172) : randInt(158, 182),
    relationshipGoal: sample(relationshipGoals),
    interests:    pickInterests(),
    isVerified:   true,
    isActive:     true,
    location: {
      type:        'Point',
      coordinates: randCoords(),
      city:        sample(cities),
      country:     'India',
    },
    preferences: {
      ageMin:           Math.max(18, age - randInt(3, 6)),
      ageMax:           age + randInt(3, 7),
      maxDistance:      randInt(20, 100),
      genderPreference: ['all'],
      showMe:           true,
    },
    stats: {
      attractivenessScore: randInt(35, 85),
      engagementScore:     randInt(10, 70),
      totalLikes:          randInt(0, 50),
      totalPasses:         randInt(0, 30),
      totalMatches:        randInt(0, 15),
    },
    premium: {
      isActive:              Math.random() < 0.2,  // 20% are premium
      plan:                  Math.random() < 0.2 ? (Math.random() < 0.5 ? 'gold' : 'platinum') : 'none',
      superLikesRemaining:   1,
      rewindsRemaining:      0,
    },
    lastActive: new Date(Date.now() - randInt(0, 7 * 24 * 3600 * 1000)), // within last week
    isOnline:   Math.random() < 0.25, // 25% online
  };
}

// ── Main seeder ───────────────────────────────────────────────
async function seed() {
  console.log('\n💖 Spark Seeder — 100 users (40M + 40F + 20 Other)\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');

  // Remove old seed data only
  const deleted = await User.deleteMany({ email: /@spark-seed\.com$/ });
  console.log(`🗑️  Cleared ${deleted.deletedCount} old seed users`);

  const users = [];

  // 40 male
  maleNames.forEach((name, i)   => users.push(buildUser(name, 'male',      i + 1)));
  // 40 female
  femaleNames.forEach((name, i) => users.push(buildUser(name, 'female',    i + 1)));
  // 20 other
  otherNames.forEach((name, i)  => users.push(buildUser(name, 'nonbinary', i + 1)));

  // Shuffle so they're not grouped by gender in the feed
  shuffle(users);

  const created = await User.insertMany(users);

  const males   = created.filter(u => u.gender === 'male').length;
  const females = created.filter(u => u.gender === 'female').length;
  const others  = created.filter(u => u.gender === 'nonbinary').length;
  const premium = created.filter(u => u.premium?.isActive).length;
  const online  = created.filter(u => u.isOnline).length;

  console.log('\n✅ Seeding complete!\n');
  console.log(`   👨 Male:      ${males}`);
  console.log(`   👩 Female:    ${females}`);
  console.log(`   🌈 Other:     ${others}`);
  console.log(`   💎 Premium:   ${premium} (~20%)`);
  console.log(`   🟢 Online:    ${online} (~25%)`);
  console.log(`   📊 Total:     ${created.length}\n`);

  await mongoose.disconnect();
  console.log('👋 Done! Start the server and run the frontend to see them in the feed.\n');
}


seed().catch((err) => {
  console.error('❌ Seeder failed:', err.message);
  process.exit(1);
});