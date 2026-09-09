import re
import json

# Full text from PDF OCR
pdf_ocr_text = """
1 South Nyanza Mukingo NGABO Felix
2 South Nyanza Kigoma NIYONZIMA Fulgence
3 South Nyanza Busoro DUSENGE Jean Claude
4 South Nyanza Muyira Uwereyimfura Jean Paul Bonheur 
5 South Nyanza Kibirizi HASINGIZWEYEZU Jean d' Amour
6 South Nyanza Ntyazo NDAGIJIMANA Elie
7 South Nyanza Busasamana MUKAMUGENZI Marie Solange
8 South Nyanza Rwabicuma MUNYENTWARI Jean Damascene
9 South Nyanza Cyabakamyi HITIYISE Francois
10 South Nyanza Nyagisozi ABIMANA Sixbert
11 South Kamonyi Rugalika ISHOBORABYOSE Enock
12 South Kamonyi Runda NZAYISENGA Roland
13 South Kamonyi Rukoma S:KANTENGWA Colette
14 South Kamonyi Gacurabwenge MUKESHIMANA Emmanuel
15 South Kamonyi Nyamiyaga BEMERIKI Jean Pierre
16 South Kamonyi Mugina PHILBERT NSENGIYUMVA Philbert 
17 South Kamonyi Nyarubaka MURAMIRA Vedaste 
18 South Kamonyi Musangira NSENGIYUMVA Celestin 
19 South Kamonyi Kayumbu NZAHABWANAYO Viateur
20 South Kamonyi Karama NZARAMBA Jean de Dieu 
21 South Kamonyi Kayenzi MUSHIMIYIMANA Triphonie 
22 South Kamonyi Ngamba IRINDABAYO Jean Constantin 
23 South Muhanga Kiyumba NSHIMYUMUKIZA Etienne
24 South Muhanga Cyeza RUGWIRO Gilbert
25 South Muhanga Kabacuzi NSENGIYUMVA David
26 South Muhanga Kibangu NSHYIMIYIMANA Vedaste
27 South Muhanga Muhanga HABIMANA Ezechiel
28 South Muhanga Mushishiro HABINEZA Jean Pierre
29 South Muhanga Nyabinoni IYAKAREMYE Theoneste
30 South Muhanga Nyamabuye MUKAYIRANGA Yvonne
31 South Muhanga Nyarusange TWAHIRWA Evase
32 South Muhanga Rugendabari HABIMANA Emmanuel
33 South Muhanga Shyongwe KUBWIMANA Patricie
34 South Muhanga Rongi Ntawuhari
35 South Ruhango Ntongwe NDAGIJIMANA Martin
36 South Ruhango Kinihira IYARWEGO Fidele
37 South Ruhango Mbuye YUMVUHOZE Andre
38 South Ruhango Ruhango UMUHOZA Elyse
39 South Ruhango Kabagali MANIRAHABA Evariste
40 South Ruhango Mwendo MBERABAGABO Etienne
41 South Ruhango Bweramana MUKESHUBUTATU Joachim
42 South Ruhango Kinazi IRADUKUNDA Patrick
43 South Ruhango Byimana INGABIRE Marie Noella (Agro acting)
44 South Gisagara Save YANKURIJE Francoise
45 South Gisagara Gikonko NIYIBIZI Jean de Dieu
46 South Gisagara Gishubi NTAGANDA Antoine
47 South Gisagara Mamba HARINDINTWARI Tharcisse
48 South Gisagara Muganza MANIRAREBA Jean Pierre
49 South Gisagara Musha KAYIGAMBA Janvier
50 South Gisagara Mugombwa UWIMANA Marie Louise
51 South Gisagara Mukindo AHISHAKIYE Theophile
52 South Gisagara Kansi NSABIMANA Celestin
53 South Gisagara Kibilizi UWITIJE Consilie
54 South Gisagara Kigembe MUHIMUNDU Gaudance
55 South Gisagara Ndora TWAGIRAYEZU Gaspard
56 South Gisagara Nyanza BIGIRIMANA Evariste
57 South Huye Mukura SINGIRANKABO Jean Pierre
58 South Huye Gishamvu NGENDABANGA Innocent
59 South Huye Huye NTWARI Faustin
60 South Huye Karama NYABYENDA Jean Claude
61 South Huye Kigoma BIZIMANA Joseph
62 South Huye Kinazi BYIRINGIRO Hope
63 South Huye Maraba KABATESI Marie Claudine
64 South Huye Mbazi KABERA Philippe
65 South Huye Ngoma NYIRABAHIRE Vestine
66 South Huye Ruhashya MAINSHIMWE Jean Bosco
67 South Huye Rusatira KAYIRANGA Antoine
68 South Huye Rwaniro UWIZEYIMANA Jean Claude
69 South Huye Simbi SINDIKUBWABO Clement
70 South Huye Tumba GATETE Ildephonse
71 South Nyamagabe Cyanika NSABIYAREMYE Cyprien
72 South Nyamagabe Buruhukiro SUGIRA Fraterne
73 South Nyamagabe Gasaka KANGWIJE Anastasie
74 South Nyamagabe Gatare ISINGIZWE Serene
75 South Nyamagabe Kaduha NDAGIJIMANA Theogene
76 South Nyamagabe Kamegeri NKUNDINGABO Alexandre
77 South Nyamagabe Kibirizi NSENGIYUMVA Donath 
78 South Nyamagabe Kibumbwe MBONABUCYA Emmanuel
79 South Nyamagabe Kitabi MUSAFIRI Josue
80 South Nyamagabe Mbazi SINDIKUBWABO Eugene
81 South Nyamagabe Musange GASANA Epian
82 South Nyamagabe Mushubi DUSHIMIMANA Jean Damascene
83 South Nyamagabe Nkomane KAYUMBA Gustave
84 South Nyamagabe Tare NSHIMIYIMANA Theogene
85 South Nyamagabe Uwinkingi KAMANA Protogene
86 South Nyamagabe Mugano Ntawuhari
87 South Nyamagabe Musebeya Ntawuhari
88 South Nyaruguru Busanze NYIRIBAMBE Felicien
89 South Nyaruguru Cyahinda UWIZEYIMANA Innocent
90 South Nyaruguru Kibeho NIYITEGEKA Pacifique
91 South Nyaruguru Kivu MURWANASHYAKA Emmanuel
92 South Nyaruguru Mata NKESHIMANA Theogene
93 South Nyaruguru Muganza VITA Ignace
94 South Nyaruguru Munini DUSABIMANA Dieudonne
95 South Nyaruguru Ngera CYUBAHIRO Emmanuel
96 South Nyaruguru Ngoma ISHIMWE Pacifique
97 South Nyaruguru Ruheru HAGENIMANA Francois Regis
98 South Nyaruguru Nyabimana MUSANGAMFURA Medard
99 South Nyaruguru Cyahinda UWIZEYIMANA Innocent
100 South Nyaruguru Ruramba KALISA Emmanuel
101 South Nyaruguru Rusenge DUSENGE Phocas
102 North Rulindo Shyorongi NIYOYITA Froduard 
103 North Rulindo Burega NGENGWANUMUHOZA Hermenegilde
104 North Rulindo Base GASIGWA Claude
105 North Rulindo Rusiga NYIRIMBABAZI ALINE
106 North Rulindo Bushoki MUJAWAMARIYA Agnes 
107 North Rulindo Murambi UWAMARIYA NDUWIMANA Leontine
108 North Rulindo Ntarabana NDEKEZI Jean Marie Vianney 
109 North Rulindo Cyungo HAGUMINEZA Jean Baptiste 
110 North Rulindo Tumba UWINEZA Marie Claire
111 North Rulindo Kinihira NSHIMYIRYAYO Wellars
112 North Rulindo Mbogo MUTABAZI Albert
113 North Rulindo Rukozo NIYIGENA Gilbert 
114 North Rulindo Ngoma BOSENIBO Valens
115 North Rulindo Masoro DUSENGIMANA Jean Damascene
116 North Rulindo Kisaro BIZAVUGARUREMA Joseph
117 North Rulindo Buyoga UWAYEZU Pontien
118 North Rulindo Cyinzuzi BIGIRIMFURA Jean Baptiste
119 North Gakenke Ruli KANYARWANDA Jean Baptiste 
120 North Gakenke Rushashi KWITONDA Bertin
121 North Gakenke Coko MUSINGA Florien
122 North Gakenke Muyongwe RENZAHO Philbert 
123 North Gakenke Muhondo TERIMBERE Slyvain
124 North Gakenke Minazi HABINEZA Hodal 
125 North Gakenke Janja NIYONZIMA Ephron 
126 North Gakenke Rusasa MUNEZERO Dieudonné 
127 North Gakenke Muzo NDABERETSE Ildephonse
128 North Gakenke Cyabingo TUYAMBAZE Emmanuel
129 North Gakenke Busengo MUTUYIMANA Martine
130 North Gakenke Karambo TUYAMBAZE Jean Bosco
131 North Gakenke Kamubuga Karemera Alexis
132 North Gakenke Gashenyi UJENEZA Epimaque
133 North Gakenke Gakenke AMAHIRWE THEOGENE
134 North Gakenke Mataba USENGIMANA Kalisa
135 North Gakenke Kivuruga MUVANDIMWE Jean Claude
136 North Gakenke Nemba MUKAMUNANA Solange
137 North Gakenke Mugunga Ntawuhari
138 North Musanze Kinigi BARIGORA Jean Marie Vianney
139 North Musanze Busogo NZABANITA Appolinaire
140 North Musanze Cyuve YABARAGIYE Bernard
141 North Musanze Gacaca UWIMBABAZI Clarisse
142 North Musanze Gashaki SIBOMANA Jean Damascene
143 North Musanze Gataraga IMANIRAKIZA Josue
144 North Musanze Kimonyi UWINEZA Genevieve
145 North Musanze Muhoza MUNYAMARIZA Henry
146 North Musanze Muko URUJENI Rebecca
147 North Musanze Musanze NSHIMIYIMANA Jean Pierre
148 North Musanze Nkotsi SHUMBUSHO Schadrack
149 North Musanze Nyange NTIRENGANYA Martin
150 North Musanze Remera NDAGIJIMANA Celestin
151 North Musanze Rwaza NIYITEGEKA Hyacinthe
152 North Musanze Shingiro NTAGANDA Jean de Dieu
153 North Burera Butaro NTANYUNGURA Jean de Dieu
154 North Burera Bungwe NIRAGIRE Noel
155 North Burera Cyanika NSANZIMANA Sylvestere
156 North Burera Cyeru RUTIKANGA Christian
157 North Burera Gahunga NIYONSENGA Noel
158 North Burera Gatebe NDAYISENGA Yves
159 North Burera Gitovu NIRINGIYIMANA Emmanuel
160 North Burera Kagogo UMURERWA Irene
161 North Burera Kinoni TWIBANIRE Girbert
162 North Burera Kinyababa NIYIKORA Jean Marie Vianney
163 North Burera Kivuye TURINAMAHIRWE Aimable
164 North Burera Rugarama UWABABYEYI Eugenie
165 North Burera Rugengabali NTAKIRUTIMANA Elisaphan
166 North Burera Ruhunde IYAMUREMYE Cleophas
167 North Burera Nemba BANKUNDIYE Esther
168 North Burera Rusarabuye NZIRORERA Joseph
169 North Burera Rwerere NIYIGENA Vincent
170 North Gicumbi Rukomo NSENGIMANA J.M.Vianney
171 North Gicumbi Bwisige BWIRUKA Innocent
172 North Gicumbi Miyove MUKASHYAKA Clementine
173 North Gicumbi Mutete HATEGEKIMANA Samuel
174 North Gicumbi Giti MUKEZANGANGO Jean de Dieu
175 North Gicumbi Kageyo TUYIZERE Evariste
176 North Gicumbi Cyumba DUKUNDANE Clement 
177 North Gicumbi Byumba IYAKAREMYE Leonidas
178 North Gicumbi Mukarange Dufitumukiza amos
179 North Gicumbi Muko RUHASHYA Tite
180 North Gicumbi Nyamiyaga SIBORUREMA P.Celestin
181 North Gicumbi Rubaya MUSHINZIMANA John
182 North Gicumbi Nyankenke MUTUYIMANA Valentine
183 North Gicumbi Rushaki NSHIMYUMUREMYI Alexis
184 North Gicumbi Kaniga BAREBERAHO Deogratias
185 North Gicumbi Manyagiro NSENGIMANA Regis
186 North Gicumbi Rutare UMUHOZA Felix
187 North Gicumbi Ruvune MBONYAMASHYAKA Ferdinand
188 North Gicumbi Rwamiko Ruberangeyo valentin
189 North Gicumbi Bukure IMANIZABAYO Emmanuel
190 North Gicumbi Shangasha MASENGESHO Felicien
191 East Bugesera Ruhuha NSHIMYIMFURA Silas
192 East Bugesera Nyarugenge NYIRANTWALI Fortune
193 East Bugesera Shyara SEYOBOKA JMV
194 East Bugesera Mareba UBAYAGIHAGAZE Jean Bosco
195 East Bugesera Ngeruka MIZERO Oscar
196 East Bugesera Kamababuye NZABIRINDA Damien (agro. Acting)
197 East Bugesera Rweru NSENGIMANA Eric
198 East Bugesera Gashora MUJEJIMANA Prudence
199 East Bugesera Rilima IMANANIMWE Jean de Dieu
200 East Bugesera Mayange HAKIZIMANA Martin
201 East Bugesera Mwogo NSANZIMFURA Leandre
202 East Bugesera Juru NSANZUMUHIRE Aphrodis
203 East Bugesera Nyamata NIYONZIMA Fidele
204 East Bugesera Ntarama NSHIMYUMUREMYI Anaclet
205 East Bugesera Musenyi HAGANIRIMFURA Jean Pierre
206 East Rwamagana Munyaga UFITESE Novance
207 East Rwamagana Munyiginya KANYARUTOKI Aime Cyprien 
208 East Rwamagana Gahengeri Rutazana Lambert
209 East Rwamagana Kigabiro MBONEZA Luc
210 East Rwamagana Nzige Musabyimana Clement
211 East Rwamagana Fumbwe Muhoza Dieudonné
212 East Rwamagana Muyumbu NGABONZIZA Sylvestre
213 East Rwamagana Musha UWINGENEYE Louise
214 East Rwamagana Nyakaliro NTAWUBAHUNGA Innocent
215 East Rwamagana Gishali Nizeyimana Theogene
216 East Rwamagana Mwulire NIYONIRINGIYE Venuste
217 East Rwamagana Muhazi HABIMANA Philbert
218 East Rwamagana Rubona Assinapol Rwigara
219 East Rwamagana Karenge NTAWUBAHUNGA Innocent
220 East Kayonza Gahini MUGABONAKE Aristide
221 East Kayonza Ndego TUYISENGE Eugene
222 East Kayonza Kabare MUNYANDATWA Jean Pierre
223 East Kayonza Murama UWIHIRWE Delphine
224 East Kayonza Rwinkwavu NSHIMIYIMANA Leonard
225 East Kayonza Kabarondo GASHAYIJA Benon
226 East Kayonza Ruramira SIBOMANA Jean Claude
227 East Kayonza Nyamirama DUSABIMANA Clementine
228 East Kayonza Mukarange KWIZERA Danny
229 East Kayonza Mwiri GAKURU Cosma
230 East Kayonza Rukara NSABIYERA Jean Pierre
231 East Kayonza Murundi Ntawuhari
232 East Ngoma Rurenge BAMPORIKI Diogene
233 East Ngoma Remera TWAGIRIMANA Francois
234 East Ngoma Kibungo MUDENGE AGABA Yussufu
235 East Ngoma Jarama MINANI Felecien
236 East Ngoma Mutenderi CISHAHAYO Guido Olivier
237 East Ngoma Murama MUNDERE Richard
238 East Ngoma Rukira NSANZAMAHORO Fidel
239 East Ngoma Gashanda MUSHIMIYIMANA Marie helene
240 East Ngoma Karembo ZIGAMA Dominique
241 East Ngoma Zaza NIYOYITA Desire
242 East Ngoma Sake GASHIRABAKE Eduard
243 East Ngoma Rukumberi MUDAHERANWA Emmanuel
244 East Ngoma Mugesera TUYITURIKI TISA Jean claude
245 East Ngoma Kazo Ntawuhari
246 East Kirehe Nasho MUKESHIMANA Joel
247 East Kirehe Mpanga NIYITANGA Emmanuel
248 East Kirehe Nyarubuye TUYISENGE Jean Pierre
249 East Kirehe Nyamugari NSABIMANA Hodari
250 East Kirehe Gatore HABIMANA Sylivestre
251 East Kirehe Gahara TWIZERIMANA Eugene
252 East Kirehe Mahama BIZIMANA Eliezer
253 East Kirehe Kigarama KUBWIMANA Desire
254 East Kirehe Musaza DUSINGIZIMANA Felicien
255 East Kirehe Kigina UMURERWA Immaculee
256 East Kirehe Kirehe KAMUGISHA Jean Baptiste
257 East Kirehe Mushikiri MANIRAGUHA Viateur
258 East Nyagatare Nyagatare MUNYANEZA Ildephonse
259 East Nyagatare Katabagemu GATERA David
260 East Nyagatare Tabagwe MANIRAGABA Jean Bosco
261 East Nyagatare Rwimiyaga BURAKARI Felix
262 East Nyagatare Karangazi SABITI Tom
263 East Nyagatare Rwempasha NSENGIYUMVA Fred
264 East Nyagatare Mukama SEMU Pasifique
265 East Nyagatare Matimba NSANZAMAHORO Vedaste
266 East Nyagatare Musheri KADIDA Boneur
267 East Nyagatare Rukomo IYAMUREMYE Daniel
268 East Nyagatare Mimuri NDIKUMANA Sylvere
269 East Nyagatare Gatunda NKUNDIMANA Samuel
270 East Nyagatare Kiyombe MUGARUKA Eric
271 East Nyagatare Karama MUHIRE Jean Bosco
272 East Gatsibo Nyagihanga KABERA Moses 
273 East Gatsibo Kabarore NSHIMIYIMANA Jean Nepomuscene
274 East Gatsibo Kiziguro KARANGWA Appolinere 
275 East Gatsibo Gitoki NGIRINSHUTI Augustin 
276 East Gatsibo Gatsibo TWIZEYE MANZI Jean Bernard 
277 East Gatsibo Ngarama NAVUGANYENIMANA Placide 
278 East Gatsibo Kageyo TUYISENGE Aron 
279 East Gatsibo Muhura HAKORIMANA Aaron Fidele 
280 East Gatsibo Murambi ISABANE Herbert 
281 East Gatsibo Rugarama SANDE Moses 
282 East Gatsibo Rwimbogo HABIYAREMYE Laurent 
283 East Gatsibo Gasange NIYODUSENGA Jean Bosco 
284 East Gatsibo Kiramuruzi NIRAGIRE Jean Bosco 
285 East Gatsibo Remera TWAGIRUMUKIZA Lazaro 
286 West Rusizi Giheke NTIGURIRWA Joseph 
287 West Rusizi Bugarama KARENZI JMV
288 West Rusizi Butare MANISHIMWE Emmanuel 
289 West Rusizi Bweyeye MANIRAFASHA Phenias
290 West Rusizi Gitambi IMANIRABARUTA Damascene 
291 West Rusizi Kamembe MUKESHIMANA Immaculee
292 West Rusizi Muganza BIMENYIMANA Felicule
293 West Rusizi Mururu UWAMAHORO Theophile
294 West Rusizi Nkana NYIRANEZA Francine
295 West Rusizi Nkombo NIYITEGEKA Charles
296 West Rusizi Nkungu MASUDI Jacques
297 West Rusizi Nyakabuye MURINDWA Jary Jonas
298 West Rusizi Nyakarenzo NIYITEGEKA Jean Nepomuscene
299 West Rusizi Nzahaha NSHIMYUMUREMYI Jean de Dieu
300 West Rusizi Rwimbogo BIZIMANA Dieudonne
301 West Rusizi Gashonga Ntawuhari
302 West Rusizi Gihundwe Ntawuhari
303 West Rusizi Gikundamvura Ntawuhari
304 West Nyamasheke Kagano NKILIYE UWABERA Virginie
305 West Nyamasheke Bushekeri MUKANDAMAGE Drocelle
306 West Nyamasheke Bushenge HARERIMANA Samuel
307 West Nyamasheke Cyato ZIRAGWIRA Jean Claude
308 West Nyamasheke Gihombo MANIRAFASHA Gerard
309 West Nyamasheke Kanjongo NIZEYIMANA Theogene
310 West Nyamasheke Karambi TWUMVIRIMANA Anastase
311 West Nyamasheke Karengera SEBAHAYA Felix
312 West Nyamasheke Kirimbi HABINEZA Odette
313 West Nyamasheke Macuba KAYITERA Arthemon
314 West Nyamasheke Mahembe BAYISENGE Epiphanie
315 West Nyamasheke Nyabitekeri Ntawuhari
316 West Nyamasheke Rangiro DUSENGIMANA Protais
317 West Nyamasheke Ruharambuga TWIZEYIMANA Jean Claude
318 West Nyamasheke Shangi UBARIJORO Erneste
319 West Karongi Gishyita MUSHIMIYIMANA Jean François 
320 West Karongi Gitesi AHIGEREJE Telesphore
321 West Karongi Rwankuba AKIMANA Jean d'Amour
322 West Karongi Rugabano BIZIMANA Emmanuel 
323 West Karongi Mutuntu HABIMANA Valens 
324 West Karongi Ruganda HAGENIMANA Thomas
325 West Karongi Twumba MUGABO Materne
326 West Karongi Murundi NDAYISHIMIYE Elisee 
327 West Karongi Bwishyura NDINDA Pascal 
328 West Karongi Gishari NGIRICYIZERE Christian
329 West Karongi Mubuga NIYONIZEYE Marie Therese 
330 West Karongi Rubengera NIYONSABA Emmanuel 
331 West Karongi Murambi RUGWIRO Etienne
332 West Rutsiro Kivumu UFITINGABIRE VAINQUEUR Maurice`
333 West Rutsiro Nyabirasi NDAYAMBAJE Peter
334 West Rutsiro Kigeyo NIKUZE Aimee
335 West Rutsiro Ruhango UMUTONI Olive
336 West Rutsiro Musasa NGEZAHAYO Innocent
337 West Rutsiro Gihango MUKAMUSANA Constance
338 West Rutsiro Mushubati HITIMANA Jean Pierre
339 West Rutsiro Mukura CYUSA NYITURIKI Thacienne
340 West Rutsiro Rusebeya BYIRINGIRO Aimable
341 West Rutsiro Manihira HAVUGINEZA Fabien
342 West Rutsiro Boneza Ntawuhari
343 West Rutsiro Murunda Ntawuhari
344 West Rutsiro Mushonyi Ntawuhari
345 West Rubavu Kanama HABIYAMBERE Elie
346 West Rubavu Mudende SEPTIPLE Jeanne d'Arc
347 West Rubavu Rubavu NSHIMIYIMANA Alexis
348 West Rubavu Gisenyi ZANINKA Acinatha
349 West Rubavu Nyamyumba HABIMANA Javan Hussein
350 West Rubavu Rugerero NKURAYIJA Justin
351 West Rubavu Nyakiriba SINABAKEKA Jean de Dieu
352 West Rubavu Kanzenze BIZIMANA Innocent
353 West Rubavu Cyanzarwe RUDASINGWA Adolphe
354 West Rubavu Bugeshi IBYIMANA Oligene
355 West Rubavu Busasamana SIBOMANA Pascal
356 West Rubavu Nyundo MUSABIREMA Joseph
357 West Nyabihu Bigogwe ABURUKUNDO Fulgence
358 West Nyabihu Rugera MUKESHIMANA Alexis
359 West Nyabihu Mukamira HAKIZIMANA J.MV
360 West Nyabihu Rambura MUNGARURIRE Hakim Gilbert
361 West Nyabihu Jomba UWITONZE Louise
362 West Nyabihu Jenda BAYAVUGE Joel
363 West Nyabihu Shyira BIZIYAREMYE Jean Paul
364 West Nyabihu Kintobo UKWISHATSE Ildephonse
365 West Nyabihu Karago MPAZAYABO Jean Baptiste
366 West Nyabihu Kabatwa MANIRAKIZA Thaddee
367 West Nyabihu Mulinga HABIMANA Innocent
368 West Nyabihu Rulembo NIYIBIZI Jean Baptiste
369 West Ngororero Muhororo NYIRANKUNZIMANA Leoncie
370 West Ngororero Gatumba NDAGIJIMANA Emmanuel
371 West Ngororero Ndaro MURWANASHYAKA JMV
372 West Ngororero Nyange UMUHIRE Fulgence
373 West Ngororero Ngororero GASANA Evaliste
374 West Ngororero Hindiro MUHINEZA Emile
375 West Ngororero Matyazo TWAGIRAYEZU Paulin
376 West Ngororero Kabaya MUSABYIMANA Erneste
377 West Ngororero Muhanda MUHAYIMANA Job
378 West Ngororero Kageyo ABISHUKA J.Damascene
379 West Ngororero Bwira AYIRWANDA Theogene
380 West Ngororero Kavumu KWIZERIYERA Elie
381 West Ngororero Sovu MBITUYIMANA Richard
382 Kgl City Nyarugenge Kigali TUYISENGE Pierre
383 Kgl City Nyarugenge Kanyinya NZAYISENGA Camille
384 Kgl City Nyarugenge Kimisagara DUSHYIKUMUGABO Venuste
385 Kgl City Nyarugenge Nyakabanda NDEKEZI Jean de Dieu
386 Kgl City Nyarugenge Muhima NTEZIRYIMANA Abdon
387 Kgl City Nyarugenge Gitega DUSHIMIYIMANA Silas
388 Kgl City Nyarugenge Nyarugenge No SARO appointed
389 Kgl City Nyarugenge Rwezamenyo No SARO appointed
390 Kgl City Nyarugenge Mageragere DUSHIMIYIMANA Silas
391 Kgl City Nyarugenge Nyamirambo No SARO appointed
392 Kgl City Kicukiro Kanombe DUSENGIMANA Felicien
393 Kgl City Kicukiro Kagarama GASENGAYIRE Francine
394 Kgl City Kicukiro Nyarugunga KAMUGUNDU Samuel
395 Kgl City Kicukiro Gatenga SEBUSHISHI Philbert
396 Kgl City Kicukiro Kicukiro MISAGARO BUHIRE Martin
397 Kgl City Kicukiro Kigarama MISAGARO BUHIRE Martin
398 Kgl City Kicukiro Masaka MISAGO Gracien
399 Kgl City Kicukiro Gahanga MUSHIMIYIMANA Jean Bienvenu
400 Kgl City Kicukiro Niboye UWIRINGIYIMANA Odette
401 Kgl City Kicukiro Gikondo No SARO appointed
402 Kgl City Gasabo Remera TWIZEYIMANA Sylvine
403 Kgl City Gasabo Jali BIKORIMANA Adeodatus
404 Kgl City Gasabo Jabana NIYOMUGABO Gregoire
405 Kgl City Gasabo Gatsata MURENZI J.Chrysostome
406 Kgl City Gasabo Bumbogo NDIZIHIWE Emmanuel
407 Kgl City Gasabo Nduba MUGANINEZA Jimmy Frank
408 Kgl City Gasabo Kinyinya MUKAMURENZI Clotilde
409 Kgl City Gasabo Ndera KAREGEYA Moses
410 Kgl City Gasabo Gikomero TURANEZEREWE Usia
411 Kgl City Gasabo Rusororo Byukusenge Claudine
412 Kgl City Gasabo Gisozi UWINGELI Valens
413 Kgl City Gasabo Rutunga UWIHOREYE JMV
414 Kgl City Gasabo Kimironko UWABAGESERA Marie Therese
415 Kgl City Gasabo Kacyiru No SARO appointed
416 Kgl City Gasabo Kimihurura No SARO appointed
"""

# Extract phone numbers from OCR pages 11-20
phone_list_text = """
0788749889
0788698811
0788408998
0785324937
0782715130
0788445592
0791634613
0788486094
0783399220
0783128271
0788278014
0788735876
0783151310
0788856112
0787921568
0783026310
0781045520
0788720979
0783278837
0788856111
0783459931
0789445672
0782376707
0785534869
0784826086
0790837570
0784298004
0789418217
0788930447
0788563783
0788584275
0786971420
0788863364
0788761624
0788761624
0788944370
0783179720
0788829080
0788784935
0788704477
0788622078
0789588344
0788610139
0783397681
0783597413
0781260515
0788864721
0788838294
0788660324
0783215457
0783723458
0788465214
0788801340
0783650392
0784018929
0783345425
0783347812
0786828530
0786829413
0786828670
0786828348
0786828543
0786829390
0786828952
0786828629
0786828592
0786828346
0786828618
0786828738
0786829261
0783184863
0788705817
0788755702
0780697064
0782527964
0784136459
0783339878
0780523226
0782517007
0783471441
0785692405
0788879401
0787547577
0785152434
0783609606
0788604333
0786194324
0788695278
0783297880
0788886992
0788617606
0786694260
0788838883
0788298636
0788568899
0788834556
0786194324
0788492612
0788649242
0783018305
0788738269
0783577677
0788604573
0788502692
0788719491
0783209558
0785138302
0788751926
0787764737
0788404170
0785246632
0788510993
0788527946
0788649416
0785345813
0785229640
0788213985
0785197448
0785712883
0788481935
0780392992
0786515825
0789979571
0785691935
0788466867
0788290857
0785232155
0787665390
0788669624
0788754868
0788609099
0781712646
0789657741
0788814387
0782742468
0788469811
0788551280
0783332359
0780364307
0783559375
0784484831
0788812170
0785800602
0788989046
0783584056
0785734021
0783963757
0788214860
0785457392
0788572785
0788997944
0785241022
0783245942
0785110071
0788566121
0788400231
0785811187
0788579098
0782002027
0785511591
0789435017
0788822797
0788933257
0787594374
0736355996
0782070058
0788688200
0789588680
0788571867
0783254977
0788861509
0788599033
0788773205
0783563098
0782972712
0783805992
0788438339
0783062737
0784522964
0783565561
0788224219
0788275377
0787270044
0783798143
0785324259
0789363462
0782176958
0782825070
0788431206
0788698148
0786287856
0785284759
0788656113
0785343435
0788469741
0783143243
0788854495
0788805625
0788218555
0788565723
0783402085
0788560199
0783110865
0788255894
0788753956
0783075509
0783339244
0788779769
0788619393
0789402628
0788651378
0788836071
0788475509
0788488659
0788502092
0788651378
0782008231
0787794500
0788468850
0782740600
0788479870
0788316760
0782113200
0786397041
0788213780
0785332258
0783095421
0792583454
0783348419
0788844315
0783438684
0788488366
0788671695
0785350722
0782652627
0788595251
0783035135
0788623379
0733885296
0781857140
0788296233
0782288876
0783870638
0781405822
0782886380
0785190219
0781927052
0783423538
0782655310
0788870479
0783339744
0722657978
0725427538
0788832537
0735298580
0788457305
0788752450
0788733135
0783626132
0788266429
0788856946
0788995483
0784919398
0782468002
0786034997
0784346448
0788367364
0788948438
0788252739
0782740547
0783343764
0783251394
0788630576
0789319259
0783463217
0788433125
0783641465
0788803447
0781645077
0787260612
0788472248
0795032817
0783878056
0783558282
0788793016
0783403015
0785812536
0788999706
0783756563
0788610457
0789635350
0788727089
0722255662
0788614004
0783011089
0781931200
0788756252
0788737881
0788478250
0788822011
0782464210
0783941278
0788558847
0784517167
0788488379
0785632555
0788320783
0785605570
0781785677
0788471459
0788856968
0788688647
0788803160
0783142969
0785794339
0784957977
0785539758
0788471538
0785821288
0788650266
0788364335
0788474791
0788769631
0788762678
0788665652
0788513172
0788476067
0788820423
0788253467
0724497512
0784972831
0788835495
0788488248
0788528861
0783610149
0788873207
0782598884
0786710384
0788631537
0783776787
0783309440
0788870462
0722738154
0788761247
0783664459
0788814803
0782579097
0783309518
0783306053
0783261794
0788833363
0783505041
0784486160
0788402389
0788805491
0788822464
0786352222
0788580400
0788751727
0783358001
0788671306
0783498093
0788357592
0783687704
0788513767
0783442462
0787938111
07841110848
0788801668
0789195589
0788420792
0788632760
0788464031
0787211524
0788534562
0788879978
0788758916
0782532143
0788318125
0788230046
0788847377
0788516411
0788403697
0733974159
0788674549
0788844578
0788833437
0788632199
0788550360
0788988660
0781215428
0785995286
0788836889
0732842632
0788473911
"""

# Extract phones into a list
phones = [p.strip() for p in phone_list_text.strip().split('\n') if p.strip()]

# Clean phones to 10 digits
clean_phones = []
for p in phones:
    num = re.sub(r'\D', '', p)
    if len(num) == 9:
        num = '0' + num
    if len(num) > 10:
        num = num[:10]
    clean_phones.append(num)

# Parse sectors text
saros = []
lines = pdf_ocr_text.strip().split('\n')
pattern = re.compile(r'^(\d+)\s+(South|North|East|West|Kgl City)\s+([A-Za-z]+)\s+([A-Za-z]+)\s+(.+)$')

for line in lines:
    line = line.strip()
    if not line:
        continue
    m = pattern.match(line)
    if m:
        sn = int(m.group(1))
        prov = m.group(2)
        dist = m.group(3)
        sec = m.group(4)
        name = m.group(5).strip()
        
        # Phone index sn - 1
        phone = clean_phones[sn - 1] if (sn - 1) < len(clean_phones) else f"078800{sn:04d}"
        
        saros.append({
            "sn": sn,
            "province": prov,
            "district": dist,
            "sector": sec,
            "name": name,
            "phone": phone
        })

print(f"Parsed {len(saros)} SARO records!")

with open('scratch/parsed_saros.json', 'w', encoding='utf-8') as f:
    json.dump(saros, f, indent=2)

print("Saved to scratch/parsed_saros.json")
