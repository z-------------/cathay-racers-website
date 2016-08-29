/* globals */

var xhr = function(url,callback) {
    var oReq = new XMLHttpRequest();
    oReq.onload = function(){
        var response = this.responseText;
        callback(response);
    };
    oReq.open("get", url, true);
    oReq.send();
};

var sectionElems = document.querySelectorAll("section");
var asideElem = document.querySelector("aside");
var navLinkElems = document.querySelectorAll("nav a");
var newsElem = document.querySelector(".news-container");

var initialismLetterElem =  document.querySelector(".initialism-letter");
var initialismWordElem =  document.querySelector(".initialism-word");

var encodeHTML = function(str){
    var elem = document.createElement("div");
    elem.textContent = str;
    return elem.innerHTML;
};

var decodeHTML = function(str){
    var elem = document.createElement("div");
    elem.innerHTML = str;
    return elem.textContent;
};

/* spinning logo on hover */

(function(){
    var logoElem = document.querySelector(".logo");
    logoElem.addEventListener("load", function(){
        var svgDoc = logoElem.contentDocument;
        var styleElem = svgDoc.createElementNS("http://www.w3.org/2000/svg", "style");

        styleElem.textContent = "#logo-rings {\
transform: rotate(0);\
transform-origin: 58.5% 50%;\
}\
svg:hover #logo-rings {\
transform: rotate(10turn);\
transition: transform 3s;\
}";
        svgDoc.querySelector("svg").appendChild(styleElem);
    });
})();

/* floating nav */

setInterval(function(){
    if (window.pageYOffset >= 500) {
        asideElem.classList.add("float");
    } else {
        asideElem.classList.remove("float");
    }
}, 50);

/* nav icons */

[].slice.call(document.querySelectorAll("nav a[data-icon]")).forEach(function(elem){
    var iconURL = "/assets/img/ui/nav-icon/" + elem.dataset.icon + ".svg";
    elem.style.backgroundImage = "url(" + iconURL + ")";
});

/* nav link titles */

[].slice.call(document.querySelectorAll("nav a")).forEach(function(elem){
    elem.setAttribute("title", elem.textContent);
});

/* highlight nav links */

function currentSection(){
    var sections = document.querySelectorAll("section");

    var contenders = [];

    for (var s = 0; s < sections.length; s++) {
        var elem = sections[s];
        var item = {
            elem: elem,
            onScreen: (function(elem){
                // elem array
                var eArr = [];
                for (var e = elem.offsetTop; e <= elem.offsetTop + elem.offsetHeight; e++) {
                    eArr.push(e);
                }

                // screen array
                var sArr = [];
                for (var s = window.scrollY; s <= window.scrollY + window.innerHeight; s++) {
                    sArr.push(s);
                }

                // calculate overlap
                var overlap = [];

                eArr.forEach(function(v){
                    if (sArr.indexOf(v) !== -1) {
                        overlap.push(v)
                    }
                });

                return (overlap[overlap.length - 1] - overlap[0])
            })(elem)
        };
        contenders.push(item);
    }

    contenders = contenders.filter(function(item){
        return isFinite(item.onScreen);
    });

    contenders.sort(function(a, b){
        if (a.onScreen > b.onScreen) {
            return -1;
        } else if (b.onScreen > a.onScreen) {
            return 1;
        }
    });

    if (contenders[0]) {
        return contenders[0].elem.getAttribute("id");
    }
    return false;
}

function scrollSpy(target){
    var id = target || currentSection();
    if (id && (location.hash !== "#" + id || !document.querySelector("nav a.current") || target)) {
        history.pushState(null, null, "#" + id);
        document.title = document.querySelector("#" + id + " h2").textContent + " - Cathay Racers";
        [].slice.call(navLinkElems).forEach(function(elem){
            elem.classList.remove("current");
        });
        document.querySelector("nav a[href='#" + id + "']").classList.add("current");
    } else if (!id && location.href.indexOf("#") !== -1) {
        document.title = "Cathay Racers";
        history.pushState("", document.title, location.pathname + location.search);

        [].slice.call(navLinkElems).forEach(function(elem){
            elem.classList.remove("current");
        });
    }
}

setInterval(function(){
    if (!smoothScrolling) {
        scrollSpy();
    }
}, 100);

/* automatic member photos */

[].slice.call(document.querySelectorAll(".members-container li")).forEach(function(elem){
    var photoElem = elem.querySelector(".member-photo");
    var name = elem.querySelector(".member-name").textContent;

    photoElem.style.backgroundImage = "url('/assets/img/members/" + name + ".png')";
    console.log("url(/assets/img/members/" + name + ".png)");
});

/* section background images */

[].slice.call(document.querySelectorAll("section[data-bg]")).forEach(function(elem){
    var imgUrl = elem.dataset.bg;

    var bgElem = document.createElement("div");
    bgElem.style.backgroundImage = "url(" + imgUrl + ")";
    bgElem.classList.add("section-bg-image");

    elem.appendChild(bgElem);
});

/* get twitter feed from queryfeed via yql */

function layoutNewsMsnry(){
    newsMsnry = new Masonry(newsElem, {
        isFitWidth: true,
        gutter: 10
    });
}

function displayTwitterStream(data){
    if (data) {
        if (!Array.isArray(data)) {
            data = [data];
        }

        data.forEach(function(post){
            var elem = document.createElement("li");

            var body = decodeHTML(post.description);
            if (body.indexOf("http://t.co/") !== -1) body = body.substring(0, body.lastIndexOf("http://t.co/"));

            elem.innerHTML = "<p>" + twttr.txt.autoLink(body) + "</p>";
            if (post.enclosure && post.enclosure.type === "image/png") {
                elem.innerHTML = "<img src='" + post.enclosure.url + "'>" + elem.innerHTML;
                elem.querySelector("img").addEventListener("load", function(){
                    layoutNewsMsnry();
                });
            }

            [].slice.call(elem.querySelectorAll("a")).forEach(function(elem){
                elem.setAttribute("target", "_blank");
            });

            newsElem.appendChild(elem);
        });

        layoutNewsMsnry();
    } else {
        document.querySelector("#news").style.display = "none";
        document.querySelector("nav [href='#news']").style.display = "none";
    }
}

if (
    localStorage.getItem("twitterStreamData") &&
    new Date().getTime() - Number(localStorage.getItem("twitterStreamCacheDate")) < 600000 /* 10 minutes */
) {
    displayTwitterStream(JSON.parse(localStorage.getItem("twitterStreamData")));
} else {
    var query = "select * from rss where url='http://www.queryfeed.net/twitter?q=from%3Acathay_racers'";
    var yqlUrl = "https://query.yahooapis.com/v1/public/yql?q=" + encodeURIComponent(query) + "&format=json";
    xhr(yqlUrl, function(r){
        r = JSON.parse(r);
        if (r && r.query && r.query.results && r.query.results.item) {
            var twitterData = r.query.results.item;
            displayTwitterStream(twitterData);

            localStorage.setItem("twitterStreamData", JSON.stringify(twitterData));
            localStorage.setItem("twitterStreamCacheDate", new Date().getTime());
        } else {
            displayTwitterStream(null);
        }
    });
}

/* initialisms */

// function initialismChange(){
//     var wordElems = [].slice.call(initialismWordElem.children);
//
//     if (initialismWordElem.querySelector(".current")) {
//         var oldWordElem = initialismWordElem.querySelector(".current");
//         var newWordElem = wordElems[wordElems.indexOf(oldWordElem) + 1] || wordElems[0];
//         var nextWordElem = wordElems[wordElems.indexOf(newWordElem) + 1] || wordElems[0];
//
//         oldWordElem.classList.remove("current");
//         oldWordElem.classList.add("prev");
//
//         newWordElem.classList.remove("next");
//         newWordElem.classList.add("current");
//
//         nextWordElem.classList.remove("prev");
//         nextWordElem.classList.add("next");
//     } else {
//         wordElems[0].classList.add("current");
//         wordElems[1].classList.add("next");
//     }
// }
//
// initialismChange();
// setInterval(initialismChange, 2000);

/* smoothScroll stuff */

var smoothScrolling = false;

var smoothScrollOptions = {
    callbackBefore: function(toggle, anchor) {
        smoothScrolling = true;
        scrollSpy(anchor.substring(1));
    },
    callbackAfter: function() {
        smoothScrolling = false;
    }
};

/* insert 'sensitive' contact info */

var contactInfo = {
    whatsapp: {
        $vars: {
            phone: "+852 5366 0920"
        }
    },
    email: {
        href: "mailto:cathayracers2016@gmail.com",
        $vars: {
            email: "cathayracers2016@gmail.com"
        }
    },
    'email-form': {
        action: "mailto:cathayracers2016@gmail.com"
    }
};

Object.keys(contactInfo).forEach(function(key){
    var info = contactInfo[key];
    var targets = document.querySelectorAll(".contact_" + key);

    var attrKeys = Object.keys(info).filter(function(key){
        return key !== "$vars";
    });

    var varKeys;

    if (info.$vars) {
        varKeys = Object.keys(info.$vars)
    } else {
        varKeys = [];
    }

    [].slice.call(targets).forEach(function(elem){
        attrKeys.forEach(function(attrKey){
            elem[attrKey] = info[attrKey];
        });

        varKeys.forEach(function(varKey){
            var varVal = info.$vars[varKey];

            elem.textContent = elem.textContent.replace(new RegExp("{" + varKey + "}", "g"), varVal);
        });
    });
});
