# Blind review sheet: reasoning answers

For each item: (1) does the VERDICT follow from the engine results in the sources? (2) is any statement misleading or unsupported? (3) would you act on it?  Score 1 (no) to 5 (yes) and note anything wrong.

## Item 1

```
STEP 1 [FACT] The cyclone causes an uninsured asset loss of 324.9 million [5].

STEP 2 [FACT] The loss results in a pre-tax loss of 361.9 million, which is 66.3% of the EBITDA [5].

STEP 3 [FACT] The EBITDA is reduced to 509.1 million after the loss [6].

STEP 4 [FACT] The net debt increases to 2,024.7 million after the loss [6].

STEP 5 [FACT] The net debt/EBITDA ratio increases to 3.98x from 3.04x [6].

STEP 6 [FACT] The EBITDA/interest ratio decreases to 3.87x from 4.15x [6].

STEP 7 [FACT] The equity/total assets ratio decreases to 24.8% from 30.6% [6].

STEP 8 [FACT] There are no covenants to test [7].

STEP 9 [CAVEAT] The sources do not provide information on the specific covenants or their terms, so we cannot determine if the loss breaches any covenants [7].

VERDICT: NOT-COMPUTABLE
CHECK NEXT: The sources do not provide information on the specific covenants or their terms.
NOT IN THE SOURCES: The specific terms of the covenants.
```

Verdict follows from the numbers (1-5): ___   Misleading or unsupported content (describe): ___   Would act on it (1-5): ___

## Item 2

```
STEP 1 [INFERENCE from 2, 3]: Pinecrest Materials Holdings reported the following financials before the event: revenue 232.5; EBITDA 36.4; net debt 102.6; interest expense 8.7; equity 65.1; total assets 335.3 [2]. The driver was typhoon storm surge and wind in the Osaka Bay area [9]. The exposed assets were Kansai International Airport and property across the Kansai region [9]. The event took place in Asia in 2018 [9].
```

Verdict follows from the numbers (1-5): ___   Misleading or unsupported content (describe): ___   Would act on it (1-5): ___

## Item 3

```
STEP 1 [INFERENCE from 3]: The loss is $12.1, which is asset damage. [3] The loss inputs are asset damage 12.1; insured recovery 0.0; lost revenue from interruption 9.8 at the company's average EBITDA margin. [3] The share of the loss that is uninsured 100.0%. [3]
```

Verdict follows from the numbers (1-5): ___   Misleading or unsupported content (describe): ___   Would act on it (1-5): ___

## Item 4

```
STEP 1 [INFERENCE from 2, 3]: Pinecrest Materials Holdings's financials before the event were revenue 232.5; EBITDA 36.4; net debt 102.6; interest expense 8.7; equity 65.1; total assets 335.3 [3]. The loss inputs are asset damage 12.1; insured recovery 0.0; lost revenue from interruption 9.8 at the company's average EBITDA margin [3]. After the loss the engine result is EBITDA 34.9; net debt 116.2; net debt/EBITDA 3.33x (was 2.82x); EBITDA/interest 4.01x (was 4.18x); equity/total assets 15.9% (was 19.4%) [6]. The engine result, covenant tests are net debt/EBITDA 3.33x against a limit of at most 3.37x: pass, under 15% headroom, headroom 1.1%; before the loss it was a pass; EBITDA/interest 4.01x against a limit of at least 3.79x: pass, under 15% headroom, headroom 5.7%; before the loss it was a pass [7].
```

Verdict follows from the numbers (1-5): ___   Misleading or unsupported content (describe): ___   Would act on it (1-5): ___

## Item 5

```
STEP 1 [INFERENCE from 1, 3]: Pinecrest Materials Holdings owns a gas-fired power plant. [1] Hazard: cold. [3] Loss inputs: asset damage 12.1; insured recovery 0.0; lost revenue from interruption 9.8 at the company's average EBITDA margin. [3] Therefore, Pinecrest Materials Holdings has a loss of 12.1 asset loss and 9.8 lost revenue from interruption. [3] The share of the loss that is uninsured is 100.0%. [3]
```

Verdict follows from the numbers (1-5): ___   Misleading or unsupported content (describe): ___   Would act on it (1-5): ___

## Item 6

```
STEP 1 [FACT] Westmere Chemicals Group faces a earthquake loss with asset damage of 242.0, no insured recovery and extra costs of 7.6 [3].
STEP 2 [FACT] The engine puts the uninsured asset loss at 242.0 and the EBITDA hit at 7.6, so the pre-tax loss is 249.6, which is 147.1% of EBITDA [5].
STEP 3 [INFERENCE from 2] The loss is very large: it exceeds half a year of EBITDA; it is driven by uninsured damage, and no recovery was supplied, so the whole damage falls on the balance sheet.
STEP 4 [FACT] After the loss EBITDA is 162.1 and net debt is 318.3; net debt/EBITDA moves from 0.40x to 1.96x [6].
STEP 5 [FACT] The net debt/EBITDA test is 1.96x against a limit of at most 2.28x: pass, under 15% headroom with headroom of 13.9%; before the loss it was a pass [7].
STEP 6 [FACT] The EBITDA/interest test is 70.48x against a limit of at least 44.25x: pass with headroom of 59.3%; before the loss it was a pass [7].
STEP 7 [FACT] The equity/total assets test is 39.8% against a limit of at least 28.3%: pass with headroom of 40.8%; before the loss it was a pass [7].
STEP 8 [INFERENCE from 5, 6, 7] No covenant is breached, but net debt/EBITDA and equity/total assets is within 15% of its limit, so a slightly larger loss or a slower insurance payment could tip it.
STEP 9 [CAVEAT] The engine assumes the uninsured cost is debt-funded and that no waiver, cure right or equity injection is available [8].
VERDICT: PASS-TIGHT (net debt/EBITDA, equity/total assets)
CHECK NEXT: how much of the remaining headroom a larger loss, a lower margin or a slower insurance payment would use; also the policy limits and deductibles on the damaged assets.
NOT IN THE SOURCES: the insurer's payment timing, any covenant waiver, and the company's actual response.
```

Verdict follows from the numbers (1-5): ___   Misleading or unsupported content (describe): ___   Would act on it (1-5): ___

## Item 7

```
STEP 1 [FACT] Pinecrest Materials Holdings faces a cold loss with asset damage of 12.1, no insured recovery and 9.8 of lost revenue from interruption [3].
STEP 2 [FACT] The engine puts the uninsured asset loss at 12.1 and the EBITDA hit at 1.5, so the pre-tax loss is 13.6, which is 37.5% of EBITDA [5].
STEP 3 [INFERENCE from 2] The loss is large relative to annual earnings; it is driven by business interruption and extra cost, and no recovery was supplied, so the whole damage falls on the balance sheet.
STEP 4 [FACT] After the loss EBITDA is 34.9 and net debt is 116.2; net debt/EBITDA moves from 2.82x to 3.33x [6].
STEP 5 [FACT] The net debt/EBITDA test is 3.33x against a limit of at most 4.04x: pass with headroom of 17.5%; before the loss it was a pass [7].
STEP 6 [FACT] The EBITDA/interest test is 4.01x against a limit of at least 3.16x: pass with headroom of 26.8%; before the loss it was a pass [7].
STEP 7 [INFERENCE from 5, 6] Every covenant still passes with room to spare, so on these inputs the loss does not threaten the lending terms.
STEP 8 [PRECEDENT] In Typhoon Jebi, Kansai airport and Japanese insurers: the driver was typhoon storm surge and wind in the Osaka Bay area [9].
STEP 9 [INFERENCE from 8, 3] Analysis (not stated in the sources): past cases suggest checking physical damage to buildings and equipment, lost revenue while the site or service is closed and disruption passed on through suppliers and customers as well as direct damage.
STEP 10 [CAVEAT] The engine assumes the uninsured cost is debt-funded and that no waiver, cure right or equity injection is available [8].
VERDICT: PASS
CHECK NEXT: whether the loss inputs are complete, for example other sites or interruption cover; also the business-interruption cover and its waiting period.
NOT IN THE SOURCES: the insurer's payment timing, any covenant waiver, and the company's actual response.
```

Verdict follows from the numbers (1-5): ___   Misleading or unsupported content (describe): ___   Would act on it (1-5): ___

## Item 8

```
STEP 1 [FACT] The cold loss results in an uninsured asset damage of 12.1 million. [3]

STEP 2 [FACT] The loss causes a reduction in EBITDA by 1.5. [5]

STEP 3 [FACT] The pre-tax loss from the cold event is 13.6 million, which is 37.5% of the EBITDA. [5]

STEP 4 [INFERENCE from 3, 5] The pre-tax loss of 13.6 million is the net loss after accounting for the reduction in EBITDA. [INFERENCE from 3, 5]

STEP 5 [FACT] The loss is entirely uninsured, as the insured recovery is 0.0. [3]

STEP 6 [FACT] The loss is funded by new debt, as per the engine assumptions. [8]

STEP 7 [FACT] The net debt increases from 102.6 million to 116.2 million. [6]

STEP 8 [FACT] The EBITDA decreases from 36.4 million to 34.9 million. [6]

STEP 9 [FACT] The net debt/EBITDA ratio increases from 2.82x to 3.33x. [6, 7]

STEP 10 [FACT] The EBITDA/interest coverage ratio decreases from 4.18x to 4.01x. [6, 7]

STEP 11 [FACT] The net debt/EBITDA ratio passes the covenant test with 17.5% headroom. [7]

STEP 12 [FACT] The EBITDA/interest coverage ratio passes the covenant test with 26.8% headroom. [7]

VERDICT: PASS-TIGHT

CHECK NEXT: The next step would be to assess the impact on the balance sheet and covenants, which has been done in the previous steps.

NOT IN THE SOURCES: The sources do not provide specific details on how the loss is reflected in the balance sheet beyond the net debt and EBITDA changes.
```

Verdict follows from the numbers (1-5): ___   Misleading or unsupported content (describe): ___   Would act on it (1-5): ___

## Item 9

```
STEP 1 [INFERENCE from 1, 2]: Westmere Chemicals Group owns a hospital group. [1] Scenario: Westmere Chemicals Group owns a hospital group. [2] Financials before the event: revenue 1,374.9; EBITDA 169.7; net debt 68.7; interest expense 2.3; equity 1,011.8; total assets 2,155.3. The loss is a hospital accident, so the financials and covenants move accordingly.
```

Verdict follows from the numbers (1-5): ___   Misleading or unsupported content (describe): ___   Would act on it (1-5): ___

## Item 10

```
Step 1 [INFERENCE from i, j]: Pinecrest Systems Inc owns a coastal refinery. [1] Hazard: cyclone. [1] All money is in millions of one currency. [1]
```

Verdict follows from the numbers (1-5): ___   Misleading or unsupported content (describe): ___   Would act on it (1-5): ___

## Item 11

```
STEP 1 [INFERENCE from 2, 5]: The loss is $97.5 million in asset damage, $11.1 million in EBITDA hit, $108.6 million in pre-tax loss, and 100.0% share of the loss that is uninsured. [2] Financials before the event: revenue 4,653.6; EBITDA 546.1; net debt 1,662.8; interest expense 131.7; equity 1,485.6; total assets 4,860.6. [5] Engine result, loss: uninsured asset loss 97.5; EBITDA hit 11.1; pre-tax loss 108.6, which is 19.9% of EBITDA; share of the loss that is uninsured 100.0%. [2] Financials before the event: revenue 4,653.6; EBITDA 546.1; net debt 1,662.8; interest expense 131.7; equity 1,485.6; total assets 4,860.6. [5] Engine result, loss: uninsured asset loss 97.5; EBITDA hit 11.1; pre-tax loss 108.6, which is 19.9% of EBITDA; share of the loss that is uninsured 100.0%. [2] Financials before the event: revenue 4,653.6; EBITDA 546.1; net debt 1,662.8; interest expense 131.7; equity 1,485.6; total assets 4,860.6. [5] Engine result, loss: uninsured asset loss 97.5; EBITDA hit 11.1; pre-tax loss 108.6, which is 19.9% of EBITDA; share of the loss that is uninsured 100.0%. [2] Financials before the event: revenue 4,653.6; EBITDA 546.1; net debt 1,662.8; interest expense 131.7; equity 1,485.6; total assets 4,860.6. [5] Engine result, loss: uninsured asset loss 97.5; EBITDA hit 11.1; pre-tax loss 108.6, which is 19.9% of EBITDA; share of the loss that is uninsured 100.0%. [2] Financials before the event: revenue 4,653.6; EBITDA 546.1; net debt 1,662.8; interest expense 131.7; equity 1,485.6; total assets 4,860.6. [5] Engine result, loss: uninsured asset loss 97.5; EBITDA hit 11.1; pre-tax loss 108.6, which is 19.9% of EBITDA; share of the loss that is uninsured 100.0%. [2] Financials before the event: revenue 4,653.6; EBITDA 546.1; net debt 1,662.8; interest expense 131.7; equity 1,485.6; total assets 4,860.6. [5] Engine result, loss: uninsured asset loss 97.5; EBITDA hit 11.1; pre-tax loss 108.6, which is 19.9% of EBITDA; share of the loss that is uninsured 100.0%. [2] Financials before the event: revenue
```

Verdict follows from the numbers (1-5): ___   Misleading or unsupported content (describe): ___   Would act on it (1-5): ___

## Item 12

```
STEP 1 [FACT] The loss results in an uninsured asset damage of 12.1 million, leading to a pre-tax loss of 13.6 million, which is 37.5% of the EBITDA [5].

STEP 2 [FACT] The EBITDA is reduced to 34.9 million after the loss, compared to 36.4 million before the loss [6].

STEP 3 [FACT] The net debt increases to 116.2 million after the loss, compared to 102.6 million before the loss [6].

STEP 4 [INFERENCE from 1, 2, 3] The reduction in EBITDA and the increase in net debt lead to a higher net debt/EBITDA ratio, which is now 3.33x, compared to 2.82x before the loss [6].

STEP 5 [FACT] The net debt/EBITDA ratio after the loss is 3.33x, which is under the covenant limit of 3.37x, with 1.1% headroom [7].

STEP 6 [FACT] The EBITDA/interest coverage ratio after the loss is 4.01x, which is above the covenant minimum of 3.79x, with 5.7% headroom [7].

STEP 7 [CAVEAT] The engine assumes that the uninsured cash cost is funded by new debt, and interest expense remains unchanged [8].

STEP 8 [INFERENCE from 5, 6] The net debt/EBITDA ratio is close to the covenant limit, indicating a potential risk of covenant breach if there are further financial pressures [7].

STEP 9 [INFERENCE from 7, 8] The EBITDA/interest coverage ratio is slightly below the previous level, suggesting a need to monitor this ratio closely [7].

VERDICT: PASS-TIGHT CHECK NEXT: Monitor the EBITDA/interest coverage ratio closely. NOT IN THE SOURCES: Typhoon Jebi, Kansai airport and Japanese insurers case summary and its outcome do not directly apply to Pinecrest Materials Holdings.
```

Verdict follows from the numbers (1-5): ___   Misleading or unsupported content (describe): ___   Would act on it (1-5): ___
