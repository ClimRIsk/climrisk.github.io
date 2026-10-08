# Global Model Lab sweep

148 studies at 37 sites, 4 hazards.

| hazard | n | hindcast failed / no skill | no model (no exposure / too little data) | validated | validated with small drift |
|---|---|---|---|---|---|
| rain | 37 | 10 | 0 | 24 | 3 |
| wind | 37 | 2 | 0 | 27 | 8 |
| heat | 37 | 0 | 0 | 15 | 22 |
| fire | 37 | 4 | 1 | 22 | 10 |

Data source used by the extreme-value studies: fire: POWER ×36, heat: POWER ×37, rain: POWER ×37, wind: POWER ×37


## Errors


## Hindcast failures and no-skill results

- Dhaka (tropical monsoon) / rain: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=0.011227502806172462 drift=0.1333137718027417 validation=None The recent years are systematically higher than the early record predicted: the hazard is increasing.
- Manaus (tropical rainforest) / fire: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=0.0050509385480741464 drift=0.1546745100748034 validation=None The recent years are systematically higher than the early record predicted: the hazard is increasing.
- Dakar (semi-arid coast) / rain: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=5.829471247206145e-05 drift=1.1402464913707773 validation=None The recent years are systematically higher than the early record predicted: the hazard is increasing.
- Dakar (semi-arid coast) / wind: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=0.027296382576419864 drift=0.12340102262721385 validation=None 
- Shanghai (humid subtropical) / rain: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=5.6126961655173594e-05 drift=0.16188035724925162 validation=None The recent years are systematically higher than the early record predicted: the hazard is increasing.
- Sydney (mediterranean/oceanic) / fire: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=0.02140413242964656 drift=0.11646430798124036 validation=None The recent years are systematically higher than the early record predicted: the hazard is increasing.
- Sao Paulo (humid subtropical) / fire: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=4.141577720173696e-06 drift=0.19617408022690885 validation=None The recent years are systematically higher than the early record predicted: the hazard is increasing.
- Santiago (mediterranean) / rain: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=0.0003178952843388529 drift=-0.15698399766275353 validation=None The recent years are systematically lower than the early record predicted.
- Cape Town (mediterranean) / rain: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=1.7881547695085323e-05 drift=0.34825491707515804 validation=None The recent years are systematically higher than the early record predicted: the hazard is increasing.
- London (temperate oceanic) / rain: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=0.015413807493214748 drift=0.16765024761285874 validation=None The recent years are systematically higher than the early record predicted: the hazard is increasing.
- New York (temperate continental) / rain: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=0.0027876645278192003 drift=0.10921241694797097 validation=None The recent years are systematically higher than the early record predicted: the hazard is increasing.
- Mexico City (subtropical highland) / wind: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=0.0024566990298475755 drift=0.1189791610620703 validation=None The recent years are systematically lower than the early record predicted.
- Ulaanbaatar (cold semi-arid) / fire: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=0.021087219558909354 drift=0.20397640961194985 validation=None The recent years are systematically lower than the early record predicted.
- Anchorage (subarctic) / rain: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=0.03775417782073509 drift=-0.17383278483033102 validation=None 
- Addis Ababa (tropical highland) / rain: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=0.0006900369955411482 drift=0.23989661030367884 validation=None The recent years are systematically higher than the early record predicted: the hazard is increasing.
- Manila (tropical coastal) / rain: verified; hindcast FAILED (the early record does not predict the recent one)  ks_p=0.00025337415416827976 drift=0.24900327087958887 validation=None The recent years are systematically higher than the early record predicted: the hazard is increasing.

## extreme-value hindcast: 88 of 147 passed outright (nominal false-fail rate ≈ 10 %)


## Slowest studies

- Auckland / heat: 4.3 s
- Auckland / fire: 4.2 s
- Addis Ababa / fire: 4.2 s
- Male / fire: 4.2 s
- Honolulu / fire: 4.1 s
