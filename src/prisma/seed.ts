/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper function to create slug from title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper function to get random date in the past
function getRandomPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.emailSubscription.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for test users
  const hashedPassword = await bcrypt.hash('Password123!', 12);

  // Create Users
  console.log('👥 Creating users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@pentateuch.com',
        fullName: 'John Doe',
        password: hashedPassword,
        isVerified: true,
        bio: "Passionate about sharing God's word and encouraging believers in their faith journey.",
        avatar: 'https://i.pravatar.cc/150?img=12',
        createdAt: getRandomPastDate(60),
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah.johnson@pentateuch.com',
        fullName: 'Sarah Johnson',
        password: hashedPassword,
        isVerified: true,
        bio: 'Writer, teacher, and lover of Scripture. Sharing devotionals and biblical insights.',
        avatar: 'https://i.pravatar.cc/150?img=45',
        createdAt: getRandomPastDate(55),
      },
    }),
    prisma.user.create({
      data: {
        email: 'david.smith@pentateuch.com',
        fullName: 'David Smith',
        password: hashedPassword,
        isVerified: true,
        bio: 'Youth pastor with a heart for discipleship and worship.',
        avatar: 'https://i.pravatar.cc/150?img=33',
        createdAt: getRandomPastDate(50),
      },
    }),
    prisma.user.create({
      data: {
        email: 'mary.wilson@pentateuch.com',
        fullName: 'Mary Wilson',
        password: hashedPassword,
        isVerified: true,
        bio: 'Prayer warrior and intercessor. Writing about the power of prayer.',
        avatar: 'https://i.pravatar.cc/150?img=27',
        createdAt: getRandomPastDate(45),
      },
    }),
    prisma.user.create({
      data: {
        email: 'james.brown@pentateuch.com',
        fullName: 'James Brown',
        password: null,
        googleId: 'google-123456',
        isVerified: true,
        bio: 'Missionary and evangelist sharing testimonies from the field.',
        avatar: 'https://i.pravatar.cc/150?img=51',
        createdAt: getRandomPastDate(40),
      },
    }),
  ]);

  // Create User Preferences
  console.log('⚙️  Creating user preferences...');
  await Promise.all([
    prisma.userPreference.create({
      data: {
        userId: users[0].id,
        tags: ['faith', 'discipleship', 'bible-study'],
      },
    }),
    prisma.userPreference.create({
      data: {
        userId: users[1].id,
        tags: ['devotion', 'prayer', 'worship'],
      },
    }),
    prisma.userPreference.create({
      data: {
        userId: users[2].id,
        tags: ['youth', 'worship', 'evangelism'],
      },
    }),
    prisma.userPreference.create({
      data: {
        userId: users[3].id,
        tags: ['prayer', 'intercession', 'faith'],
      },
    }),
    prisma.userPreference.create({
      data: {
        userId: users[4].id,
        tags: ['missions', 'evangelism', 'testimony'],
      },
    }),
  ]);

  // Create Posts with various tags
  console.log('📝 Creating posts...');
  const postsData = [
    {
      title: 'Walking in Faith: Trusting God in Uncertain Times',
      content: `In times of uncertainty, our faith is tested. But it's precisely in these moments that we grow closer to God. Hebrews 11:1 reminds us that "faith is confidence in what we hope for and assurance about what we do not see."

When we face challenges that seem insurmountable, we must remember that God is always faithful. He has never abandoned His children, and He won't start now. Our responsibility is to trust Him, even when we can't see the path ahead.

Consider the example of Abraham, who left his homeland not knowing where he was going, simply because God called him. His faith wasn't based on understanding everything; it was based on knowing WHO he was following.

Today, I encourage you to take a step of faith. Whatever uncertainty you're facing, surrender it to God. Trust that He has a plan and that His ways are higher than ours.

Prayer: "Lord, help me to walk by faith and not by sight. Give me the courage to trust You even when I don't understand. Amen."`,
      authorId: users[0].id,
      tags: ['faith', 'trust', 'devotion'],
      daysAgo: 5,
    },
    {
      title: 'The Power of Daily Prayer: Building Intimacy with God',
      content: `Prayer isn't just a religious duty—it's a conversation with the Creator of the universe. It's how we build intimacy with God and align our hearts with His will.

Daniel prayed three times a day, not out of obligation, but out of love and devotion. His prayer life was so consistent that even when threatened with death, he continued his practice.

Many believers struggle with prayer because they see it as a monologue rather than a dialogue. But true prayer involves speaking AND listening. It's in the quiet moments that God often speaks to our hearts.

Here are three practical ways to strengthen your prayer life:

1. Set aside a specific time each day for prayer
2. Keep a prayer journal to track answered prayers
3. Pray scripture back to God

Remember, God isn't interested in eloquent words—He desires a sincere heart. Come to Him as you are, and watch your relationship with Him deepen.`,
      authorId: users[3].id,
      tags: ['prayer', 'devotion', 'spiritual-growth'],
      daysAgo: 3,
    },
    {
      title: 'Youth Ministry: Reaching the Next Generation for Christ',
      content: `The challenge of youth ministry today is real. We're competing with social media, peer pressure, and a culture that increasingly rejects biblical values. But we serve a God who specializes in the impossible.

Jesus said, "Let the little children come to me, and do not hinder them, for the kingdom of heaven belongs to such as these." Our calling is to create spaces where young people can encounter God authentically.

Authenticity is key. Today's youth can spot fake faith from a mile away. They need mentors who live what they preach, who struggle and succeed, who show them that Christianity isn't about perfection but about relationship.

At our youth group, we've seen transformation when we:
- Create judgment-free zones for questions
- Share our own struggles and testimonies
- Make worship relevant and engaging
- Invest in one-on-one discipleship

Don't give up on this generation. They're hungry for truth and desperate for genuine love. Be the light that guides them to Jesus.`,
      authorId: users[2].id,
      tags: ['youth', 'ministry', 'discipleship', 'evangelism'],
      daysAgo: 7,
    },
    {
      title: 'Worship Beyond Sunday: Living a Life of Praise',
      content: `Worship isn't confined to Sunday morning services. Romans 12:1 tells us to offer our bodies as living sacrifices—this is our true and proper worship.

True worship is a lifestyle. It's praising God when things are going well AND when they're falling apart. It's choosing gratitude over complaining, faith over fear, and love over bitterness.

I've learned that worship transforms us. When we focus on God's greatness rather than our problems, our perspective shifts. Suddenly, the mountains in our lives don't seem so intimidating.

David was a worshiper. He danced before the Lord with all his might. He wrote psalms in his darkest hours. He understood that worship wasn't about performance—it was about a heart fully devoted to God.

This week, practice worship in everyday moments:
- Thank God during your morning commute
- Sing praises while doing household chores
- Declare His goodness when facing challenges

Let your life be a continuous song of worship to the King of Kings.`,
      authorId: users[1].id,
      tags: ['worship', 'praise', 'devotion', 'spiritual-growth'],
      daysAgo: 10,
    },
    {
      title: 'Bible Study Made Simple: A Guide for Beginners',
      content: `Starting to study the Bible can feel overwhelming. Where do you begin? How do you understand ancient texts? What if you have questions?

Let me encourage you: God's Word is meant to be understood. The Holy Spirit is our teacher, and He delights in revealing truth to those who seek it.

Here's a simple method I use:

1. **Pray first** - Ask the Holy Spirit for understanding
2. **Read the passage** - Start with one chapter or even a few verses
3. **Observe** - What does it say? Who wrote it? To whom?
4. **Interpret** - What did it mean to the original audience?
5. **Apply** - How does this apply to my life today?

Start with the Gospel of John if you're new to the Bible. It beautifully presents Jesus and His teachings. Read consistently, even if it's just 10 minutes a day.

Remember Psalm 119:105: "Your word is a lamp for my feet, a light on my path." Let Scripture guide your daily walk with Christ.`,
      authorId: users[0].id,
      tags: ['bible-study', 'discipleship', 'spiritual-growth'],
      daysAgo: 12,
    },
    {
      title: 'Intercession: Standing in the Gap for Others',
      content: `Intercession is one of the highest callings of a believer. It's standing before God on behalf of others, pleading for their needs, their salvation, their breakthrough.

Ezekiel 22:30 says, "I looked for someone among them who would build up the wall and stand before me in the gap on behalf of the land." God is still looking for intercessors today.

In my years of prayer ministry, I've witnessed miracles through intercession:
- Marriages restored
- Addictions broken
- Prodigals returning home
- Physical healings manifested

Intercession requires persistence. Abraham interceded for Sodom, Moses for Israel, and Jesus intercedes for us even now at the right hand of the Father.

Who has God placed on your heart? That person struggling with faith? That family member who doesn't know Jesus? That nation in crisis?

Don't underestimate the power of your prayers. When you intercede, you partner with God in His redemptive work on earth. Stand in the gap. Your prayers matter more than you know.`,
      authorId: users[3].id,
      tags: ['prayer', 'intercession', 'faith', 'spiritual-warfare'],
      daysAgo: 15,
    },
    {
      title: 'Missions Update: Testimonies from the Field',
      content: `Greetings from the mission field! I want to share some incredible testimonies that will strengthen your faith and remind you why missions matter.

Last month, we held an evangelistic outreach in a remote village. We weren't sure anyone would come. But God had other plans. Over 200 people gathered, and 87 gave their lives to Christ!

One story particularly touched my heart: A woman named Grace had been practicing witchcraft for 30 years. She came to the meeting out of curiosity. When we prayed for her, she felt God's presence and began weeping. She renounced her old ways and accepted Jesus. The transformation was instant and undeniable.

Missions isn't easy. We face language barriers, cultural challenges, and spiritual opposition. But every time we see someone encounter Jesus, every time a life is transformed, we remember why we're here.

You're part of this mission too! Your prayers and support make this work possible. You may not be on the field, but you're sending the light of the Gospel to the darkest corners of the earth.

Keep praying. Keep giving. Keep believing. Together, we're fulfilling the Great Commission.`,
      authorId: users[4].id,
      tags: ['missions', 'evangelism', 'testimony', 'faith'],
      daysAgo: 2,
    },
    {
      title: 'Discipleship: Following Jesus in Everyday Life',
      content: `Jesus didn't call us to be casual admirers—He called us to be disciples. The difference? Admiration requires little; discipleship requires everything.

Luke 9:23 records Jesus saying, "Whoever wants to be my disciple must deny themselves and take up their cross daily and follow me." Notice the word "daily." Discipleship isn't a one-time decision; it's a daily commitment.

True discipleship involves:

**Learning** - Studying His Word and teachings
**Imitating** - Following His example in our actions
**Obeying** - Doing what He commands, not just what feels comfortable
**Multiplying** - Teaching others what we've learned

The early disciples left everything to follow Jesus. They didn't have theological degrees or special training. They simply spent time with Him, watched how He lived, and did what He did.

Who are you discipling? Who's discipling you? We weren't meant to walk this journey alone. Find a mentor, be a mentor, and grow together in Christ.

Discipleship is messy, challenging, and costly. But it's also the most fulfilling way to live. When we follow Jesus wholeheartedly, we discover life in its fullest.`,
      authorId: users[0].id,
      tags: ['discipleship', 'faith', 'spiritual-growth', 'bible-study'],
      daysAgo: 8,
    },
    {
      title: 'Breaking Free: Overcoming Spiritual Bondage',
      content: `Many believers live in bondage without realizing it. Bondage to fear, anxiety, unforgiveness, past trauma, or habitual sin. But 2 Corinthians 3:17 declares, "Where the Spirit of the Lord is, there is freedom."

Freedom isn't automatic; it's fought for. It requires recognizing our bondage, repenting, and receiving God's deliverance.

I spent years bound by unforgiveness. Someone had deeply hurt me, and I nursed that pain like a prized possession. But unforgiveness poisoned my soul, affected my relationships, and hindered my prayers.

One day, the Holy Spirit convicted me: "You can't carry this cross and follow Me too." That's when I realized—unforgiveness was my cross, not His. His yoke is easy and His burden is light.

When I chose to forgive (even though I didn't "feel" like it), chains broke. Peace flooded my heart. Joy returned. I was FREE.

What's holding you captive? What chains are keeping you from experiencing abundant life in Christ? Whatever it is, bring it to Jesus. He's the ultimate chain-breaker.

John 8:36 promises: "If the Son sets you free, you will be free indeed." Not partially free, not temporarily free, but TRULY free. That freedom is available to you today.`,
      authorId: users[1].id,
      tags: ['spiritual-warfare', 'freedom', 'healing', 'faith'],
      daysAgo: 18,
    },
    {
      title: "The Great Commission: Every Believer's Calling",
      content: `Before Jesus ascended to heaven, He gave His disciples (and us) the Great Commission: "Go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit" (Matthew 28:19).

This wasn't a suggestion for super-spiritual Christians. It's a command for every believer. We're all called to evangelize, whether across the street or across the ocean.

Some say, "I'm not called to evangelism." But Scripture disagrees. The question isn't whether you're called to share the Gospel; it's where and how God wants you to do it.

Evangelism doesn't always mean street preaching (though God bless those who do). It can be:
- Sharing your testimony with a coworker
- Inviting a neighbor to church
- Showing Christ's love through acts of service
- Supporting missionaries financially and prayerfully

I've led people to Christ in coffee shops, grocery stores, and online forums. The key is being sensitive to the Holy Spirit's leading and willing to be used.

Romans 10:14 asks, "How can they believe in the one of whom they have not heard?" Someone needs to tell them. Why not you? Why not today?

The harvest is plentiful, but the workers are few. Will you answer the call?`,
      authorId: users[4].id,
      tags: ['evangelism', 'missions', 'discipleship', 'great-commission'],
      daysAgo: 20,
    },
    {
      title: 'Fasting and Prayer: Seeking God with Intensity',
      content: `Fasting is a lost discipline in modern Christianity, yet Scripture presents it as a normal practice for believers seeking breakthrough.

Jesus said "WHEN you fast," not "IF you fast" (Matthew 6:16). He assumed His followers would fast regularly.

Fasting isn't about impressing God or earning His favor. It's about saying, "God, I need You more than I need food. I'm desperate for Your presence, Your power, Your answers."

I've practiced various types of fasting:
- Complete water-only fasts
- Daniel fasts (vegetables and water)
- Partial fasts (one meal a day)
- Media fasts (from technology and entertainment)

Every time, God has met me in profound ways. Fasting sharpens spiritual sensitivity, breaks stubborn strongholds, and accelerates answers to prayer.

Isaiah 58 describes the kind of fasting God desires—one that leads to justice, compassion, and transformation. It's not just abstaining from food; it's coupling our physical sacrifice with spiritual action.

If you've never fasted, start small. Skip one meal and spend that time in prayer. Watch what God does when you deny your flesh to seek His face.

Some battles are only won through prayer and fasting (Mark 9:29). What breakthrough are you believing for?`,
      authorId: users[3].id,
      tags: ['prayer', 'fasting', 'spiritual-warfare', 'devotion'],
      daysAgo: 14,
    },
    {
      title: "Grace Upon Grace: Understanding God's Unmerited Favor",
      content: `Grace is the heartbeat of the Gospel. It's the undeserved, unearned, unmerited favor of God toward sinners. And it's the most misunderstood concept in Christianity.

Some think grace is a license to sin: "God will forgive anyway, so why try?" Others swing to the opposite extreme, living under legalism and performance, never quite measuring up.

But Romans 6:1-2 addresses the first group: "Shall we go on sinning so that grace may increase? By no means!" And Ephesians 2:8-9 speaks to the second: "For it is by grace you have been saved, through faith—not by works."

Grace doesn't excuse sin; it empowers us to overcome it. Grace doesn't promote laziness; it inspires transformation. Grace doesn't contradict holiness; it's the only way to achieve it.

I lived for years trying to earn God's approval through my performance. I worked myself to exhaustion in ministry, thinking my efforts would make Him love me more. Then I discovered the truth: He couldn't love me more than He already does.

That revelation changed everything. When I understood grace, I stopped striving and started resting. Ironically, that's when I became most effective in serving Him.

Grace isn't just for salvation—it's for every moment of every day. Live in it. Walk in it. Extend it to others. Grace upon grace upon grace.`,
      authorId: users[1].id,
      tags: ['grace', 'faith', 'salvation', 'devotion'],
      daysAgo: 22,
    },
  ];

  const posts: any[] = [];
  for (const postData of postsData) {
    const publishedAt = getRandomPastDate(postData.daysAgo);
    const post = await prisma.post.create({
      data: {
        title: postData.title,
        content: postData.content,
        slug: createSlug(postData.title),
        authorId: postData.authorId,
        tags: postData.tags,
        published: true,
        publishedAt: publishedAt,
        allowComments: true,
        createdAt: publishedAt,
      },
    });
    posts.push(post);
  }

  // Create Comments
  console.log('💬 Creating comments...');
  const commentsData = [
    {
      postIdx: 0,
      userIdx: 1,
      content: 'This really encouraged me today. Thank you for sharing!',
    },
    {
      postIdx: 0,
      userIdx: 3,
      content: 'Amen! Walking by faith is the only way forward.',
    },
    {
      postIdx: 1,
      userIdx: 0,
      content:
        "Such practical advice on prayer. I'm going to start a prayer journal.",
    },
    {
      postIdx: 1,
      userIdx: 2,
      content: 'Daniel is one of my heroes. His prayer life inspires me.',
    },
    {
      postIdx: 2,
      userIdx: 1,
      content:
        'As a youth leader myself, this resonates deeply. Keep fighting the good fight!',
    },
    {
      postIdx: 3,
      userIdx: 0,
      content:
        'Beautiful reminder that worship is a lifestyle, not just a Sunday activity.',
    },
    {
      postIdx: 4,
      userIdx: 2,
      content:
        'The Gospel of John is where I started too! Great advice for beginners.',
    },
    {
      postIdx: 5,
      userIdx: 4,
      content:
        "Powerful word on intercession. I'm committing to stand in the gap more.",
    },
    {
      postIdx: 6,
      userIdx: 0,
      content:
        'Praise God for these testimonies! Your work is making an eternal impact.',
    },
    {
      postIdx: 6,
      userIdx: 1,
      content:
        'Amazing to see God moving so powerfully. Keep up the kingdom work!',
    },
    {
      postIdx: 7,
      userIdx: 3,
      content: 'Daily commitment is key. Thanks for this reminder.',
    },
    {
      postIdx: 8,
      userIdx: 2,
      content:
        'Freedom in Christ is real! Thank you for being vulnerable and sharing your story.',
    },
    {
      postIdx: 9,
      userIdx: 1,
      content:
        'This challenged me. We ALL have a role in the Great Commission.',
    },
    {
      postIdx: 10,
      userIdx: 0,
      content:
        "I've been thinking about fasting. This gave me the push I needed.",
    },
    {
      postIdx: 11,
      userIdx: 4,
      content: 'Grace changed my life. Still learning to walk in it daily.',
    },
  ];

  for (const commentData of commentsData) {
    await prisma.comment.create({
      data: {
        content: commentData.content,
        postId: posts[commentData.postIdx].id,
        authorId: users[commentData.userIdx].id,
        createdAt: getRandomPastDate(commentData.postIdx),
      },
    });
  }

  // Create Likes (distribute likes to make some posts more popular)
  console.log('❤️  Creating likes...');
  const likesData = [
    // Post 0: 15 likes (popular)
    ...Array(5).fill({ postIdx: 0, userIdxs: [1, 2, 3, 4] }),
    // Post 1: 12 likes
    ...Array(4).fill({ postIdx: 1, userIdxs: [0, 2, 3, 4] }),
    // Post 2: 8 likes
    ...Array(3).fill({ postIdx: 2, userIdxs: [0, 1, 3] }),
    // Post 3: 18 likes (most popular)
    ...Array(5).fill({ postIdx: 3, userIdxs: [0, 1, 2, 4] }),
    // Post 4: 10 likes
    ...Array(3).fill({ postIdx: 4, userIdxs: [1, 2, 3] }),
    // Post 5: 7 likes
    ...Array(2).fill({ postIdx: 5, userIdxs: [0, 2, 4] }),
    // Post 6: 14 likes
    ...Array(4).fill({ postIdx: 6, userIdxs: [0, 1, 2, 3] }),
    // Post 7: 9 likes
    ...Array(3).fill({ postIdx: 7, userIdxs: [1, 3, 4] }),
    // Post 8: 11 likes
    ...Array(3).fill({ postIdx: 8, userIdxs: [0, 2, 3, 4] }),
    // Post 9: 13 likes
    ...Array(4).fill({ postIdx: 9, userIdxs: [0, 1, 2] }),
    // Post 10: 6 likes
    ...Array(2).fill({ postIdx: 10, userIdxs: [1, 4] }),
    // Post 11: 8 likes
    ...Array(2).fill({ postIdx: 11, userIdxs: [0, 2, 3, 4] }),
  ];

  // Simplified like creation - just use first few users for each post
  for (let i = 0; i < posts.length; i++) {
    const numLikes = Math.floor(Math.random() * 4) + 2; // 2-5 likes per post
    for (let j = 0; j < numLikes && j < users.length; j++) {
      try {
        await prisma.like.create({
          data: {
            postId: posts[i].id,
            userId: users[j].id,
          },
        });
      } catch (error) {
        // Skip duplicate likes
      }
    }
  }

  // Create Email Subscriptions
  console.log('📧 Creating email subscriptions...');
  await Promise.all([
    prisma.emailSubscription.create({
      data: { email: 'subscriber1@example.com' },
    }),
    prisma.emailSubscription.create({
      data: { email: 'subscriber2@example.com' },
    }),
    prisma.emailSubscription.create({
      data: { email: 'subscriber3@example.com' },
    }),
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Users: ${users.length}`);
  console.log(`   Posts: ${posts.length}`);
  console.log(`   Comments: ${commentsData.length}`);
  console.log(`   User Preferences: ${users.length}`);
  console.log('\n🔑 Test Credentials:');
  console.log('   Email: john.doe@pentateuch.com');
  console.log('   Password: Password123!');
  console.log('\n   (All test users use the same password)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
