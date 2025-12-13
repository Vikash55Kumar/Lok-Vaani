import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding business categories...');

  // Business categories with their weightage scores
  const businessCategories = [
    { name: 'Insolvency Professional', weightageScore: 5, categoryType: 'BUSINESS' },
    { name: 'Corporate Debtor', weightageScore: 4.5, categoryType: 'BUSINESS' },
    { name: 'Creditor to a Corporate Debtor', weightageScore: 4.5, categoryType: 'BUSINESS' },
    { name: 'Personal Guarantor to a Corporate Debtor', weightageScore: 4, categoryType: 'BUSINESS' },
    { name: 'Academics', weightageScore: 3.5, categoryType: 'BUSINESS' },
    { name: 'Partnership firms', weightageScore: 2.5, categoryType: 'BUSINESS' },
    { name: 'Proprietorship firms', weightageScore: 2.5, categoryType: 'BUSINESS' },
    { name: 'User', weightageScore: 2, categoryType: 'USER' },
    { name: 'Others', weightageScore: 1, categoryType: 'BUSINESS' },
  ];

  for (const category of businessCategories) {
    await prisma.businessCategory.upsert({
      where: { name: category.name },
      update: {
        weightageScore: category.weightageScore,
        categoryType: category.categoryType,
      },
      create: {
        name: category.name,
        weightageScore: category.weightageScore,
        categoryType: category.categoryType,
      },
    });
  }

  console.log('✅ Business categories seeded successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });