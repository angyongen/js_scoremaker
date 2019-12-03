var s1 = document.createElement("script")
var s2 = document.createElement("script")
s1.src = "https://www.googletagmanager.com/gtag/js?id=UA-46602867-3"
s2.textContent = "window.dataLayer = window.dataLayer || [];\
function gtag(){dataLayer.push(arguments);}\
gtag('js', new Date());gtag('config', 'UA-46602867-3');"

if (window.location.href.substr(0,4) != "file") {
	document.head.appendChild(s1)
	document.head.appendChild(s2)
}