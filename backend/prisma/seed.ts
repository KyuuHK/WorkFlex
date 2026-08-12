import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, SpaceType } from "../generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const spaces = [
  {
    name: "The Vault Coworking",
    city: "Panama City",
    type: SpaceType.DESK,
    pricePerHour: "3.50",
    capacity: 1,
    description: "Hot desk in a vibrant shared space with high-speed fiber.",
  },
  {
    name: "The Vault Coworking",
    city: "Panama City",
    type: SpaceType.PRIVATE_OFFICE,
    pricePerHour: "12.00",
    capacity: 4,
    description: "Private office with natural light and meeting room access.",
  },
  {
    name: "Costa Norte Hub",
    city: "Boca del Rio",
    type: SpaceType.DESK,
    pricePerHour: "2.75",
    capacity: 1,
    description: "Beachfront desk with outdoor workspace and surf-friendly hours.",
  },
  {
    name: "Costa Norte Hub",
    city: "Boca del Rio",
    type: SpaceType.PRIVATE_OFFICE,
    pricePerHour: "9.00",
    capacity: 2,
    description: "Compact private office overlooking the bay.",
  },
];

async function main() {
  const count = await prisma.space.count();
  if (count > 0) {
    console.log(`Seeding skipped: ${count} spaces already exist.`);
    return;
  }

  await prisma.space.createMany({
    data: spaces.map((s) => ({
      ...s,
      pricePerHour: s.pricePerHour,
    })),
  });

  console.log(`Seeded ${spaces.length} coworking spaces.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
