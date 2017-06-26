//---------------------------------------------------------
// Name:      parseElanXml
// Purpose:   Parses Elan XML file & updates DB accordingly
// Args:      XML String, callback function
// Notes: 	  Dependant on ObjTree
//---------------------------------------------------------
function parseElanXml (xmlString, callback) {
	var xotree = new XML.ObjTree();
	var json = xotree.parseXML(xmlString);
	var n = parseFloat(json.nn.antragsjahr);
	var usageCodes = ["50", "Mischkulturen", "51", "Mischkulturen", "54", "Streifen", "56", "Pufferstreifen", "57", "Pufferstreifen", "58", "Feldrand", "112", "Winterhartweizen/Durum", "113", "Sommerhartweizen/Durum", "114", "Winter-Dinkel", "115", "Winterweizen", "116", "Sommerweizen", "118", "Winter-Emmer/", "119", "Sommer-Emmer/", "120", "Sommer-Dinkel", "121", "Winterroggen", "122", "Sommerroggen", "125", "Wintermenggetreide", "131", "Wintergerste", "132", "Sommergerste", "142", "Winterhafer", "143", "Sommerhafer", "144", "Sommermenggetreide", "156", "Wintertriticale", "157", "Sommertriticale", "171", "Mais", "172", "Zuckermais", "181", "Rispenhirse", "182", "Buchweizen", "183", "Sorghumhirse", "186", "Amarant", "187", "Quinoa", "210", "Erbsen", "211", "Gemüseerbse", "212", "Platterbse", "220", "Acker-/Puff-/Pferdebohne", "221", "Wicken", "222", "Dicke", "230", "Lupinen", "240", "Gemenge", "250", "Gemenge", "292", "Linsen", "311", "Raps", "312", "Sommerraps", "315", "Winterrübsen", "316", "Sommerrübsen", "320", "Sonnenblumen", "330", "Sojabohnen", "341", "Lein", "392", "Krambe/", "393", "Leindotter", "411", "Mais", "413", "Futterrübe/Runkelrübe", "414", "Kohl-/Steckrüben", "421", "Rot-/Weiß-/Alexandriner-/Inkarnat-/Erd-/Schweden-/Persischer Klee", "422", "Kleegras", "423", "Luzerne,", "424", "Ackergras", "425", "Klee-Luzerne-Gemisch", "426", "Bockshornklee,", "427", "Hornklee,", "429", "Esparsette", "430", "Serradella", "431", "Steinklee", "432", "Kleemischung", "433", "Luzerne-Gras-Gemisch", "459", "Grünland", "480", "Streuobst", "492", "Dauergrünland", "510", "Goldrute", "511", "Streptocarpus/Drehfrucht", "512", "Iberischer", "513", "Braunellen", "514", "Hauswurz", "515", "Mühlenbeckia/Drahtsträucher", "516", "Knöterich", "517", "Garten-Petunie", "518", "Polygonum", "519", "Köcherblümchen", "520", "Silberbrandschopf", "563", "Langj.", "564", "Aufforstung", "567", "Langj.", "572", "Uferrandstreifenprogramm", "573", "Uferrandstreifenprogramm", "574", "Blühstreifen", "575", "Blühfläche", "576", "Schutzstreifen", "583", "Naturschutz", "590", "Brache", "593", "Brachefläche", "591", "AL aus Erzeugung genommen", "592", "DGL aus Erzeugung genommen", "594", "Dauerkulturen", "602", "Kartoffeln", "603", "Zuckerrüben", "604", "Topinambur", "613", "Gemüsekohl", "614", "Brauner", "615", "Echte", "616", "Senfrauke", "617", "Gartenkresse", "618", "Gartenrettiche", "619", "Weißer", "620", "Gemüserübe", "622", "Tomaten", "623", "Auberginen", "624", "Paprika,", "625", "Schwarze", "627", "Salatgurke", "628", "Zuckermelone", "629", "Riesenkürbis", "630", "Gartenkürbis", "631", "Melone", "633", "Zwiebeln", "634", "Möhre", "635", "Gartenbohne", "636", "Feldsalate", "637", "Salat", "638", "Spinat", "639", "Mangold", "640", "Melde", "641", "Sellerie", "642", "Ampfer", "643", "Pastinaken", "644", "Zichorien/Wegwarten", "645", "Kichererbsen", "646", "Meerrettich", "647", "Schwarzwurzeln", "648", "Fenchel", "649", "Gemüserübsen", "651", "Anethum", "652", "Kerbel", "653", "Bibernellen", "654", "Kümmel", "655", "Kreuzkümmel", "656", "Schwarzkümmel", "657", "Koriander", "658", "Liebstöckel/Maggikraut", "659", "Petroselinum", "660", "Basilikum", "661", "Rosmarin", "662", "Salbei", "663", "Borretsch", "664", "Oregano", "665", "Bohnenkräuter", "666", "Hyssopus", "667", "Verbenen", "668", "Lavendel", "669", "Thymian", "670", "Melissen", "671", "Enziane", "672", "Minzen", "673", "Artemisia", "674", "Ringelblumen", "675", "Sonnenhut", "676", "Wegeriche", "677", "Kamillen", "678", "Schafgarben", "679", "Baldriane", "680", "Johanniskräuter", "681", "Frauenmantel", "682", "Mariendisteln", "683", "Galega", "684", "Löwenzahn", "685", "Engelwurzen", "686", "Malven", "701", "Hanf", "702", "Rollrasen", "703", "Färber-Waid", "704", "Glanzgräser", "705", "Virginischer", "706", "Mohn", "707", "Erdbeeren", "708", "Färberdisteln", "709", "Brennnesseln", "710", "Färberkrapp", "721", "Goldlack", "722", "Einjähriges", "723", "Garten-/", "724", "Kugelamarant", "725", "Taglilien", "726", "Lilien", "727", "Narzissen", "728", "Knorpelmöhren", "729", "Hasenohren", "730", "Seidenpflanzen", "731", "Hyazinthe", "732", "Milchstern", "733", "Astern", "734", "Chrysantheme,", "735", "Strohblumen", "736", "Edelweiß", "737", "Margeriten", "738", "Rudbeckien", "739", "Tagetes", "740", "Wucherblumen", "741", "Strandflieder", "742", "Spreublumen", "743", "Zinnien", "744", "Taubnesseln", "745", "Gladiolen", "746", "Tulpen", "747", "Christophskräuter", "748", "Feldrittersporne", "749", "Scabiosen", "750", "Dahlien", "751", "Rhodiola", "752", "Krokusse", "753", "Hibiskus", "754", "Strauch-/Bechermalven", "755", "Wolfsmilch", "756", "Löwenmäulchen", "757", "Garten-Montbretie", "758", "Halskräuter", "759", "Gipskräuter", "760", "Amerikanisches", "761", "Kosmeen", "762", "Nachtkerzen", "763", "Nachtkerzen", "764", "Königskerzen", "765", "Kapuzinerkressen", "766", "Pfingstrosen", "767", "Schwertlilien", "768", "Wiesenknopf", "769", "Zieste", "770", "Vergissmeinnicht", "771", "Portulak", "772", "Nelken", "773", "Ageratum", "774", "Lonas", "775", "Kornblumen", "776", "Veilchen", "777", "Phacelia", "778", "Alpendistel", "779", "Amacrinum", "780", "Begonien", "781", "Calla/Drachenwurz", "782", "Glockenblumen", "783", "Schildblume", "784", "Christrose-/Schnee-/Weihnachtsrose,", "785", "Eukalyptus", "786", "Fingerhut", "787", "Fuchsien", "788", "Geranien", "789", "Veronica/Hebe/Ehrenpreis", "790", "Anemonen", "791", "Knollenbegonien", "792", "Kornrade", "793", "Leimkraut/Taubenkropf-Leimkraut", "794", "Orchideen", "795", "Pelargonien", "796", "Fetthenne,", "797", "Rhizinus", "798", "Ramtillkraut", "799", "Husarenknopf", "802", "Silphium", "803", "Sudangras,", "804", "Sida", "805", "Igniscum", "822", "Streuobst", "825", "Kernobst", "826", "Steinobst", "827", "Beerenobst", "829", "Sonstige", "833", "Haselnüsse", "834", "Walnüsse", "838", "Baumschulen", "839", "Beerenobst", "840", "Korbweiden", "841", "Niederwald", "842", "Rebland", "850", "Sonstige", "851", "Rhabarber", "852", "Chinaschilf/Miscanthus", "853", "Riesenweizengras/Szarvasi-Gras", "854", "Rohrglanzgras", "856", "Hopfen", "857", "Aromahopfen", "858", "Bitterhopfen", "859", "Hopfen", "860", "Spargel", "861", "Artischocke", "862", "Heidekraut", "863", "Rosen", "864", "Rhododendron", "865", "Trüffel", "907", "Höhere", "910", "Wildacker", "911", "Rübensamenvermehrung", "912", "Grassamenvermehrung", "913", "Klee-/Luzernesamenvermehrung", "914", "Versuchsflächen", "924", "Vertragsnaturs.", "956", "Aufforstung", "972", "NFF: Dauergruenland", "973", "NFF: Ackernutzung", "983", "Weihnachtsbäume", "994", "Unbefestigte", "995", "Forstflächen", "996", "Vorübergehende, unbefestigte Mieten, Stroh-, Futter- oder Dunglagerplätze auf AL", "999", "Gattung/Art nicht in Liste"];
	var ignoredCodes = ['459','492','563','564','567','572','590','592','594','994','956','972','983','995','999'];

	profile.bulkGet({
			docs: [
				{id: 'fields'},
				{id: 'cropsList'}
			]
		}).then(function (doc) {
			// both fields and cropsList exists
			if (doc.results[0].docs[0].ok && doc.results[1].docs[0].ok) {
				var fields = doc.results[0].docs[0].ok
				var cropsList = doc.results[1].docs[0].ok
				parseFields(fields, cropsList, callback)
			}
			// just fields
			else if (doc.results[0].docs[0].ok && doc.results[1].docs[0].error) {
				var fields = doc.results[0].docs[0].ok
				parseFields(fields,null,callback)
			}
			// just cropsList
			else if (doc.results[0].docs[0].error && doc.results[1].docs[0].ok) {
				var cropsList = doc.results[1].docs[0].ok
				parseFields(null,cropsList,callback)
			}
			// none
			else {
				parseFields(null,null,callback)
			}
		}).catch(function (err) {
			console.log(err)
	});

	function parseFields (doc, cropsList,callback) {
		if (!doc) {
			var doc = {}
			doc['_id'] = 'fields'
		}
		if (!cropsList) {
			var cropsList = {array: []}
			cropsList['_id'] = 'cropsList'
		}
		json.nn.land.parzelle.forEach(function (field) {
			if (ignoredCodes.indexOf(field.nutzungaj.code) > -1) {
			    // these plots will be greenland, permanent greenland or other non arable crops and are not part of the optimisation. May be changed in later versions. 
			    // See usage codes in according variable for info
			    return
			}
			else {
			  	var id = parseFloat(field.schlag.nummer);
			  	if (typeof doc[id] == 'undefined') {
			  		doc[id] = {}
			  	}
			  	//doc[id] = {};
			  	// Add field no	
			    doc[id].fieldid = id;

			  	// Add field name
			  	if (typeof field.schlag.bezeichnung !== 'undefined') {
			  		doc[id].name = field.schlag.bezeichnung
			    }
			    else {
			    	// if name unknow add 'no name'
			    	doc[id].name = "Ohne Bezeichnung";
			    }
			    // Add field size
			    doc[id].size = parseFloat((field.nettoflaeche / 10000).toFixed(2))

			    // Declare as root crop capable
			    doc[id].rootCrop = true

			    // Add previous crops
		    	// For year n - 1
		    	// if a previous crop is given for that year
		        if (field.nutzungvj.code !== undefined) {
		            doc[id][n-1] = usageCodes[usageCodes.indexOf(field.nutzungvj.code) + 1];
		        }
		        // For year n
		        doc[id][n] = usageCodes[usageCodes.indexOf(field.nutzungaj.code) + 1];

		        // add crop of year n to cropsList
		        if (cropsList.array.indexOf(usageCodes[usageCodes.indexOf(field.nutzungaj.code) + 1]) == -1) {
		        	cropsList.array.push(usageCodes[usageCodes.indexOf(field.nutzungaj.code) + 1])
		        }
		        // store field
		        //	return firebase.database().ref(userPath + '/fields').child(id).update(doc[id]);
		        	return 
			} 			
		});

		return profile.bulkDocs([doc, cropsList]).then(function () {
			if (callback) {
				return callback()
			}
		})
	}
}