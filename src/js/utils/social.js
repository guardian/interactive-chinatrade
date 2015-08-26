function ShareButtons(selector) {    
    var shareButtons = document.querySelectorAll(selector || '.btns-share button');

    for (var i = 0; i < shareButtons.length; i++) {
        shareButtons[i].addEventListener('click',openShareWindow);
    }

    function openShareWindow(e){
        var twitterBaseUrl = "https://twitter.com/intent/tweet?text=";
        var facebookBaseUrl = "https://www.facebook.com/dialog/feed?display=popup&app_id=741666719251986&link=";
        var pageUrl = "http://gu.com/p/4b9h8";
        var shareImage = "pic.twitter.com/TdatLErLKG";
        var sharePNG = "http://visuals.guim.co.uk/2015/images/chinatrade-image.png";

        var pageMessage = "A drop in China's imports could drag many countries down"+ " " + 
                pageUrl + " #China " + " " + shareImage;
        
        var shareWindow = "";
        var network = e.currentTarget.getAttribute('data-source'); 
        var type = e.currentTarget.getAttribute('data-type'); 

        //console.log(network, type);
        if(network === "twitter"){
            var message = pageMessage; 
            shareWindow = 
                twitterBaseUrl + 
                encodeURIComponent(message);

            //console.log(message);
        }else if(network === "facebook"){
            var url = pageUrl; 
            shareWindow = 
                facebookBaseUrl + 
                encodeURIComponent(url) + 
                "&picture=" + 
                encodeURIComponent(sharePNG) + 
                "&redirect_uri=http://www.theguardian.com";
            
            //console.log(url);
        }
        //console.log(shareWindow);
        
        window.open(shareWindow, network + "share", "width=640,height=320");
    }
}

module.exports = ShareButtons;