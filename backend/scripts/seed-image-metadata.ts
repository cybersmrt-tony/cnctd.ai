/**
 * Script to seed avatar image metadata into the database
 * This creates sample image library entries for testing
 *
 * Usage: npx tsx scripts/seed-image-metadata.ts
 */

import { nanoid } from 'nanoid';

// Sample image metadata for Sophie
const sophieImages = [
  {
    category: 'casual',
    subcategory: 'everyday',
    tags: 'casual, coffee shop, cozy, sweater',
    mood: 'relaxed',
    time_of_day: 'afternoon',
    setting: 'coffee shop',
    outfit_style: 'casual chic',
    caption_template: 'Just grabbed my favorite latte ☕'
  },
  {
    category: 'artistic',
    subcategory: 'painting',
    tags: 'art, painting, creative, studio',
    mood: 'focused',
    time_of_day: 'morning',
    setting: 'art studio',
    outfit_style: 'artistic casual',
    caption_template: 'Working on something new today...'
  },
  {
    category: 'selfie',
    subcategory: 'portrait',
    tags: 'selfie, closeup, natural, smile',
    mood: 'happy',
    time_of_day: 'any',
    setting: 'indoor',
    outfit_style: 'casual',
    caption_template: 'Feeling good today 😊'
  },
  {
    category: 'outdoor',
    subcategory: 'park',
    tags: 'outdoor, nature, park, casual',
    mood: 'peaceful',
    time_of_day: 'afternoon',
    setting: 'park',
    outfit_style: 'casual',
    caption_template: 'Love these quiet moments in nature'
  },
  {
    category: 'casual',
    subcategory: 'home',
    tags: 'home, cozy, relaxed, comfortable',
    mood: 'content',
    time_of_day: 'evening',
    setting: 'home',
    outfit_style: 'comfy',
    caption_template: 'Just relaxing at home'
  }
];

// Sample image metadata for Isabella
const isabellaImages = [
  {
    category: 'elegant',
    subcategory: 'formal',
    tags: 'elegant, dress, sophisticated, evening',
    mood: 'confident',
    time_of_day: 'evening',
    setting: 'upscale venue',
    outfit_style: 'elegant formal',
    caption_template: 'Evening plans tonight...'
  },
  {
    category: 'casual',
    subcategory: 'wine',
    tags: 'wine, sophisticated, intimate, evening',
    mood: 'relaxed',
    time_of_day: 'evening',
    setting: 'wine bar',
    outfit_style: 'casual elegant',
    caption_template: 'A perfect glass of red 🍷'
  },
  {
    category: 'literary',
    subcategory: 'reading',
    tags: 'book, reading, cafe, intellectual',
    mood: 'contemplative',
    time_of_day: 'afternoon',
    setting: 'cafe',
    outfit_style: 'smart casual',
    caption_template: 'Lost in a good book'
  },
  {
    category: 'selfie',
    subcategory: 'portrait',
    tags: 'selfie, sophisticated, closeup, natural',
    mood: 'mysterious',
    time_of_day: 'any',
    setting: 'indoor',
    outfit_style: 'elegant',
    caption_template: 'Thoughts on my mind'
  },
  {
    category: 'night',
    subcategory: 'city',
    tags: 'night, city, urban, sophisticated',
    mood: 'adventurous',
    time_of_day: 'night',
    setting: 'city streets',
    outfit_style: 'night out',
    caption_template: 'The city at night has a magic to it'
  }
];

// Sample image metadata for Maya
const mayaImages = [
  {
    category: 'fitness',
    subcategory: 'workout',
    tags: 'workout, gym, fitness, active',
    mood: 'energetic',
    time_of_day: 'morning',
    setting: 'gym',
    outfit_style: 'athletic',
    caption_template: 'Morning workout done! 💪'
  },
  {
    category: 'beach',
    subcategory: 'surfing',
    tags: 'beach, surfing, ocean, summer',
    mood: 'excited',
    time_of_day: 'afternoon',
    setting: 'beach',
    outfit_style: 'beachwear',
    caption_template: 'Waves were perfect today! 🏄‍♀️'
  },
  {
    category: 'adventure',
    subcategory: 'hiking',
    tags: 'hiking, nature, outdoors, adventure',
    mood: 'adventurous',
    time_of_day: 'morning',
    setting: 'mountain',
    outfit_style: 'hiking gear',
    caption_template: 'Summit views are the best!'
  },
  {
    category: 'selfie',
    subcategory: 'sport',
    tags: 'selfie, athletic, energetic, post-workout',
    mood: 'happy',
    time_of_day: 'any',
    setting: 'gym',
    outfit_style: 'sportswear',
    caption_template: 'Feeling great after that session!'
  },
  {
    category: 'casual',
    subcategory: 'outdoor',
    tags: 'casual, outdoor, sunny, relaxed',
    mood: 'cheerful',
    time_of_day: 'afternoon',
    setting: 'outdoor cafe',
    outfit_style: 'casual summer',
    caption_template: 'Soaking up the sunshine ☀️'
  }
];

// Generate SQL insert statements
function generateSQL() {
  const avatars = [
    { id: 'avatar-sophie', images: sophieImages },
    { id: 'avatar-isabella', images: isabellaImages },
    { id: 'avatar-maya', images: mayaImages }
  ];

  console.log('-- Avatar Image Library Seed Data');
  console.log('-- Run this after creating the schema\n');

  avatars.forEach(avatar => {
    avatar.images.forEach((img, index) => {
      const id = nanoid();
      const filePath = `${img.category}/${avatar.id}_${img.category}_${index + 1}.jpg`;

      console.log(`INSERT INTO avatar_images (id, avatar_id, file_path, category, subcategory, tags, mood, time_of_day, setting, outfit_style, caption_template, send_count)
VALUES ('${id}', '${avatar.id}', '${filePath}', '${img.category}', '${img.subcategory}', '${img.tags}', '${img.mood}', '${img.time_of_day}', '${img.setting}', '${img.outfit_style}', '${img.caption_template}', 0);
`);
    });
  });

  console.log('\n-- Total images: ' + (sophieImages.length + isabellaImages.length + mayaImages.length));
}

generateSQL();
