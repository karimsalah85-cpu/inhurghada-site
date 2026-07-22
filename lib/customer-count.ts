type CustomerRecord = {
  phone?: string | null;
  customer_email?: string | null;
  reference?: string | null;
};

export function countDistinctCustomers(records: CustomerRecord[]) {
  const identities = new Set<string>();

  for (const record of records) {
    const phone = record.phone?.replace(/\D/g, "");
    const email = record.customer_email?.trim().toLowerCase();
    identities.add(phone ? `phone:${phone}` : email ? `email:${email}` : `booking:${record.reference || identities.size}`);
  }

  return identities.size;
}
