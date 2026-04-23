/**
 * Britium Express Official Tariff Logic
 * Base Weight: 3KG
 * Surcharge: 500 MMK per additional KG
 */
export const calculateSystemRate = (baseRate: number, weight: number) => {
  const THRESHOLD = 3;
  const RATE_PER_KG = 500;
  
  const extraWeight = Math.max(0, weight - THRESHOLD);
  const surcharge = extraWeight * RATE_PER_KG;
  
  return {
    baseRate,
    surcharge,
    totalWaybill: baseRate + surcharge
  };
};
