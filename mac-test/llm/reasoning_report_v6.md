# Reasoning evaluation

140 held-out rows from precedent events never used in training, scored by code (no model grades another model).

| model | composite | verdict | near limit | out of range | follows a change | says not computable | ignores irrelevant | no invented numbers | all checks |
|---|---|---|---|---|---|---|---|---|---|
| climrisk-llm-v6 | 0.906 | 98% | 97% | 100% | 80% | 67% | 96% | 100% | 76% |
| qwen2.5:7b | 0.619 | 61% | 94% | 62% | 0% | 21% | 96% | 74% | 6% |
| climrisk-llm-v2 | 0.335 | 10% | 19% | 12% | 0% | 17% | 100% | 91% | 0% |
| climrisk-llm-v5 | 0.283 | 1% | 0% | 3% | 0% | 4% | 100% | 94% | 0% |
| climrisk-llm-v5b | 0.269 | 0% | 0% | 0% | 0% | 0% | 100% | 89% | 0% |
| rule-based teacher (ceiling) | 1.000 | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |

Baselines: always answering the commonest verdict (BREACH) scores 50% on verdict accuracy; ignoring the change in a counterfactual pair scores 0% on following a change.

Best model: **climrisk-llm-v6**. It beats the commonest-verdict baseline on verdict accuracy. It follows a changed input in 80% of pairs whose true verdict changes.

What this does and does not show

- The engine computes every figure. A model is scored on whether it reads those figures correctly, reaches the verdict they imply, refuses when the engine result is absent, and ignores a passage that does not bear on the question.
- The reference answers come from a rule-based reasoner, so a model that matches them has learned the analysis procedure and its phrasing; this is not evidence of general intelligence or of new knowledge.
- Scenarios are synthetic inputs paired with real precedent passages from only a few dozen curated events. Real covenant packages are more varied. A lender's or insurer's own calculation remains the authority.
- At run time every chain is re-checked by the same code; a failing chain is replaced by the rule-based chain and labelled as such.
- A blind review by risk professionals is still needed before anyone relies on the narrative: see the review sheet.
