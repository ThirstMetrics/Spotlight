/**
 * Stations Casinos Multi-Property Data Generator
 *
 * Creates 1 organization group (Stations Casinos) with 5 properties,
 * each having 3-6 outlets with scaled product data.
 * Proves the multi-property, multi-outlet architecture works.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STATIONS_PROPERTIES = [
  {
    name: "Red Rock Casino Resort & Spa",
    slug: "red-rock",
    address: "11011 W Charleston Blvd",
    city: "Las Vegas",
    state: "NV",
    zip: "89135",
    outlets: [
      { name: "T-Bones Chophouse", type: "Fine Dining", slug: "t-bones" },
      { name: "Hearthstone Kitchen", type: "Restaurant", slug: "hearthstone" },
      { name: "Rocks Lounge", type: "Lounge", slug: "rocks-lounge" },
      { name: "Lucky Bar", type: "Casino Bar", slug: "lucky-bar-rr" },
      { name: "Sandbar Pool", type: "Pool", slug: "sandbar-pool" },
      { name: "Cherry Nightclub", type: "Nightlife", slug: "cherry" },
    ],
  },
  {
    name: "Green Valley Ranch Resort",
    slug: "green-valley",
    address: "2300 Paseo Verde Pkwy",
    city: "Henderson",
    state: "NV",
    zip: "89052",
    outlets: [
      { name: "Hank's Fine Steaks", type: "Fine Dining", slug: "hanks" },
      { name: "Turf Grill", type: "Restaurant", slug: "turf-grill" },
      { name: "Drop Bar", type: "Casino Bar", slug: "drop-bar" },
      { name: "Lobby Bar", type: "Lounge", slug: "lobby-bar-gvr" },
      { name: "Backyard Pool", type: "Pool", slug: "backyard-pool" },
    ],
  },
  {
    name: "Palace Station Hotel & Casino",
    slug: "palace-station",
    address: "2411 W Sahara Ave",
    city: "Las Vegas",
    state: "NV",
    zip: "89102",
    outlets: [
      { name: "Oyster Bar", type: "Restaurant", slug: "oyster-bar-ps" },
      { name: "Boathouse Asian Eatery", type: "Restaurant", slug: "boathouse" },
      { name: "The Lounge", type: "Lounge", slug: "lounge-ps" },
      { name: "Palace Prime", type: "Fine Dining", slug: "palace-prime" },
    ],
  },
  {
    name: "Boulder Station Hotel & Casino",
    slug: "boulder-station",
    address: "4111 Boulder Hwy",
    city: "Las Vegas",
    state: "NV",
    zip: "89121",
    outlets: [
      { name: "The Broiler", type: "Restaurant", slug: "the-broiler" },
      { name: "Railhead", type: "Bar & Grill", slug: "railhead" },
      { name: "Sideout Bar", type: "Casino Bar", slug: "sideout-bar" },
    ],
  },
  {
    name: "Sunset Station Hotel & Casino",
    slug: "sunset-station",
    address: "1301 W Sunset Rd",
    city: "Henderson",
    state: "NV",
    zip: "89014",
    outlets: [
      { name: "Sonoma Cellar Steakhouse", type: "Fine Dining", slug: "sonoma-cellar" },
      { name: "Brass Fork", type: "Restaurant", slug: "brass-fork" },
      { name: "Club Madrid", type: "Nightlife", slug: "club-madrid" },
      { name: "Gaudi Bar", type: "Casino Bar", slug: "gaudi-bar" },
      { name: "Pool Deck", type: "Pool", slug: "pool-deck-ss" },
    ],
  },
];

async function main() {
  console.log("🏗️  Generating Stations Casinos multi-property data...\n");

  // Create organization group
  const group = await prisma.organizationGroup.create({
    data: {
      name: "Stations Casinos LLC",
      slug: "stations-casinos",
    },
  });
  console.log(`✓ Created group: ${group.name}`);

  let totalOutlets = 0;

  for (const property of STATIONS_PROPERTIES) {
    const org = await prisma.organization.create({
      data: {
        name: property.name,
        slug: property.slug,
        address: property.address,
        city: property.city,
        state: property.state,
        zip: property.zip,
        organizationGroupId: group.id,
      },
    });
    console.log(`\n✓ Created property: ${org.name}`);

    for (const outlet of property.outlets) {
      await prisma.outlet.create({
        data: {
          name: outlet.name,
          slug: outlet.slug,
          type: outlet.type,
          organizationId: org.id,
          isActive: true,
        },
      });
      totalOutlets++;
      console.log(`  ✓ Outlet: ${outlet.name} (${outlet.type})`);
    }
  }

  console.log(`\n✅ Stations Casinos generation complete!`);
  console.log(`   Properties: ${STATIONS_PROPERTIES.length}`);
  console.log(`   Total outlets: ${totalOutlets}`);
  console.log(
    "\n   Note: Product data, orders, and sales share the same products"
  );
  console.log(
    "   table as Resorts World. Run seed-demo.ts first for product data."
  );
}

main()
  .catch((e) => {
    console.error("Generation failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
