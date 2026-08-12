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
  {
    name: "The Cube Coworking",
    city: "Panama City",
    type: SpaceType.DESK,
    pricePerHour: "4.00",
    capacity: 1,
    description: "Modern coworking in the heart of Panama City with open work areas and solid internet.",
  },
  {
    name: "The Cube Coworking",
    city: "Panama City",
    type: SpaceType.PRIVATE_OFFICE,
    pricePerHour: "12.00",
    capacity: 4,
    description: "Private office with meeting rooms inside The Cube, perfect for small teams.",
  },
  {
    name: "My Office Panamá",
    city: "Panama City",
    type: SpaceType.DESK,
    pricePerHour: "3.50",
    capacity: 1,
    description: "Creative workspace on Calle 50 with flexible solutions for digital nomads.",
  },
  {
    name: "My Office Panamá",
    city: "Panama City",
    type: SpaceType.PRIVATE_OFFICE,
    pricePerHour: "10.00",
    capacity: 3,
    description: "Private office with wooden design and community events for entrepreneurs.",
  },
  {
    name: "Zenko BusinessWalk",
    city: "Panama City",
    type: SpaceType.DESK,
    pricePerHour: "3.00",
    capacity: 1,
    description: "New space in the financial district with business-first amenities.",
  },
  {
    name: "Zenko BusinessWalk",
    city: "Panama City",
    type: SpaceType.PRIVATE_OFFICE,
    pricePerHour: "9.50",
    capacity: 2,
    description: "Compact private office in Bella Vista near the financial district.",
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
