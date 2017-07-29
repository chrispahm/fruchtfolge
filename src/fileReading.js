if (window.File && window.FileList && window.FileReader) {
    document.getElementById("xml").addEventListener("change", function(event) {
            var file = event.target.files[0]; //FileList object
            var xmlReader = new FileReader();

            xmlReader.addEventListener("load", function(event) {
                var xml = event.target.result;
                return parseElanXml(xml);
            });
            //Read the text file
            xmlReader.readAsText(file);
        }
    );

    document.getElementById("gml").addEventListener("change", function(event) {
            if (document.getElementById("xml") == "") return 
            var file = event.target.files[0]; //FileList object
            var xmlReader = new FileReader();

            xmlReader.addEventListener("load", function(event) {
                var gml = event.target.result;
                return parseElanGml(gml);
            });

            //Read the text file
            xmlReader.readAsText(file);
        }
    );
} else {
    console.log("Your browser does not support File API");
}
