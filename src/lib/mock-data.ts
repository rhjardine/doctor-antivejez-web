// src/lib/mock-data.ts

import { TelotestReport } from '@/types/genetics';

export const telotestReportData: TelotestReport = {
  patient: {
    firstName: 'Juan Carlos',
    lastName: 'Mendez Abache',
    birthDate: new Date('1967-07-22'),
    chronologicalAge: 56,
    customerCode: 'TEL07172AA',
  },
  results: {
    averageTelomereLength: '1,34 kb',
    estimatedBiologicalAge: '53 ± 1 years',
    agingDifference: -3,
  },
  interpretation: 'Your biological age is less than your real age, at the cellular level you are fine. Keep your lifestyle healthy. If you want to rejuvenate at the cellular level, try to increase foods with anti-inflammatory and antioxidant properties. You will find your ideal treatment in the following sections.',
  therapeuticResults: [
    { category: 'API', items: ['Metformin'] },
    { category: 'Phytochemical', items: ['Oral Pomage', 'Silimarin', 'Pomage', 'Pinetonin', 'Oral Green Tea (GreenSelect)', 'Oral Ginkgo Biloba', 'Pycnogenol (Pinus pinaster)', 'Piperin', 'Turmeric dry extract', 'Miodesin'] },
    { category: 'Antioxidant', items: ['Oral Coenzyme Q10', 'Oral Astaxanthin', 'Resveratrol', 'Coenzyme Q10', 'Astaxanthin', 'Omega 3'] },
    { category: 'Vitamine', items: ['Oral Vitamin C', 'Colecalciferol (Vit. D3)'] },
    { category: 'Mineral', items: ['SiliciuMax TM'] },
  ],
  generalRecommendations: [
    {
      category: 'Nutrition',
      points: [
        'Eat more fruits (apples, pears ...), oatmeal, whole wheat and rice',
        'Incorporate anti-inflammatory foods (such as turmeric or dark chocolate) and nourishing antioxidants (such as garlic, broccoli or green tea) into your daily eating pattern.',
        'Increase the consumption of foods rich in omega-3s such as salmon, sole, cauliflower, etc.',
        'Reduce the amount of sodium (particularly present in cooking salt) because it inhibits the levels of adiponectin, a natural inflammation inhibitor.',
        'Reduce the amount of protein and excessive calorie intake to prevent premature aging.',
        'Take the recommended daily amount of vitamins B6, B12, folate, C and E. Low levels of B vitamins are closely associated with premature shortening of telomeres and an increased risk of developing age-related diseases;vitamins C and E are powerful antioxidants that preserve telomere length.',
      ],
    },
    {
      category: 'Lifestyle',
      points: [
        'Get enough rest to prevent inflammatory processes.',
        'If you smoke or are a former smoker, it is important that you take supplements with resveratrol to protect against oxidative damage caused by tobacco smoke.',
        'Do moderate exercises every day to improve your respiratory capacity and increase your metabolism. This will have a positive effect on your health and a protective effect on the shortening of telomeres.',
      ],
    },
  ],
  references: [
    { id: 1, text: 'Ventura Marra M, et al. Nutrition Risk is Associated with Leukocyte Telomere Length...', url: '#' },
    { id: 2, text: 'Reichert S, Stier A. Does oxidative stress shorten telomeres in vivo? A review.', url: '#' },
    { id: 3, text: 'Crous-Bou M, et al. Mediterranean diet and telomere length in Nurses\' Health Study...', url: '#' },
  ],
};
