//Load fontawesome
var faXHR = new XMLHttpRequest;
faXHR.open("GET", "https://kit.fontawesome.com/b3eba993dd.js", true);
faXHR.onreadystatechange = function() {
    if (faXHR.readyState === 4 && faXHR.status === 200) {
        eval(faXHR.responseText);
    }
}
faXHR.send();

function updateTypers(typingUsers) {
	var typingUsers = JSON.parse(typingUsers)
	if (typingUsers == null) {
		typingUsers = [];
	}
	var typingText = document.getElementById("typingtext");
	var typingElem = document.getElementById("typing");
	switch(typingUsers.length) {
		case 0:
			typingText.innerHTML = "";
			typingElem.style = null;
			return
		case 1:
			typingText.innerHTML = typingUsers[0].Nick + " is typing...";
			break
		case 2:
			typingText.innerHTML = typingUsers[0].Nick + " and "+ typingUsers[1].Nick +  " are typing...";
			break
		default:
			if (typingUsers.length < 5) {
				extra = typingUsers.length - 2 + " other users";
			} else {
				extra = "serveral other users";
			}
			typingText.innerHTML = typingUsers[0].Nick + ", "+ typingUsers[1].Nick + " and " + extra + " are typing...";
	}
	typingElem.style.visibility = "visible";
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

function loadservers(name, id, img, src) {
    var newserver = document.createElement("div");
	newserver.className = "server";
	newserver.id = id;
	var newsel = document.createElement("div");
	newsel.className = "selector";
    newserver.appendChild(newsel);
    if (img) {
        var newicon = document.createElement("img");
	    newicon.src = src;
    } else {
        var newicon = document.createElement("p");
	    newicon.innerHTML = src;
    }
	newserver.appendChild(newicon)
	var newtooltip = document.createElement("div");
	newtooltip.className = "tooltip-text";
	newtooltip.innerHTML = name;
	newserver.appendChild(newtooltip);
	newserver.addEventListener("mouseenter", showServerTooltip);
	newserver.addEventListener("mouseleave", hideServerTooltip);
	newserver.setAttribute("onclick", "wv(JSON.stringify({'type': 'selectServer', 'content': '"+id+"'}));")
    document.getElementById("sidenav").appendChild(newserver);
}

function loaddmusers(name, id, img) {
    if (document.getElementById(id)) {
        if (document.getElementById(id).className.indexOf("dmuser") != -1) {
            return
        }
    }
    var newuser = document.createElement("div");
    newuser.className = "dmuser";
    newuser.id = id;
    var newuserimg = document.createElement("img");
    newuserimg.src = img;
    newuserimg.className = "dmavatar";
    newuser.appendChild(newuserimg);
    var newusername = document.createElement("p");
    newusername.className = "dmusername";
    newusername.innerHTML = name;
	newuser.appendChild(newusername);
	newuser.setAttribute("onclick", "wv(JSON.stringify({'type': 'loadDMChannel', 'content': '"+id+"'}));")
    document.getElementById("chancontainer").appendChild(newuser);
}

function createmessage(id) {
    var messages = document.getElementById("messages");
	var msg = document.createElement("div");
	msg.id = id;
	messages.appendChild(msg);
}

function selectserver(id, name) {
    document.getElementsByClassName("server selected")[0].classList.remove("selected");
	document.getElementById(id).classList.add("selected");
	document.getElementById("servername").innerHTML = name;
	var chancon = document.getElementById("chancontainer");
	chancon.innerHTML = "";
}

function addchannels(nocat, cat) {
	var chancon = document.getElementById("chancontainer");
	var tempchancon = document.createElement("div");
	tempchancon.id = "chancontainer";
	tempchancon.style = "overflow-y: scroll;";
	try {
		var noncategorized = JSON.parse(nocat);
	} catch(e) {}
	try {
		var categorized = JSON.parse(cat);
	} catch(e) {}
	if (noncategorized != null) {
		noncategorized.forEach(function(chan) {
			var div = document.createElement("div");
			div.className = "chan";
			var icon = document.createElement("i");
			icon.className = "fas fa-hashtag";
			div.appendChild(icon);
			var para = document.createElement("p");
			para.className = "channame";
			para.innerHTML = escapeHtml(chan.name);
			div.appendChild(para);
			div.id = chan.id;
			div.setAttribute("onclick", "wv(JSON.stringify({'type': 'setActiveChannel', 'content': '"+chan.id+"'}));");
			tempchancon.appendChild(div);
		})
	}
	if (categorized != null) {
		categorized.forEach(function(category) {
			var cathead = document.createElement("p");
			cathead.className = "chanhead";
			cathead.innerHTML = escapeHtml(category.category.name.toUpperCase());
			cathead.id = category.category.id;
			tempchancon.appendChild(cathead);
			var catcon = document.createElement("div");
			catcon.id = category.category.id + "-contain";
			tempchancon.appendChild(catcon);
			category.channels.forEach(function(chan) {
				var div = document.createElement("div");
				div.className = "chan";
				var icon = document.createElement("i");
				icon.className = "fas fa-hashtag";
				div.appendChild(icon);
				var para = document.createElement("p");
				para.className = "channame";
				para.innerHTML = escapeHtml(chan.name);
				div.appendChild(para);
				div.id = chan.id;
				div.setAttribute("onclick", "wv(JSON.stringify({'type': 'setActiveChannel', 'content': '"+chan.id+"'}));");
				catcon.appendChild(div);
			})
		})
	}
	chancon.parentNode.replaceChild(tempchancon, chancon);

}

function selectchannel(id, name) {
	var infoicon = document.getElementById("infoicon");
	infoicon.style.visibility = "visible";
	infoicon.classList.remove("fa-at");
	infoicon.classList.add("fa-hashtag");
	var title = document.getElementById("channeltitle");
	title.innerHTML = name;
	title.style.visibility = "visible";
	document.getElementById("messageinput").placeholder = "Message #" + name;
	if (document.getElementsByClassName("chan selected")[0]) {
		document.getElementsByClassName("chan selected")[0].classList.remove("selected");
	}
	document.getElementById(id).classList.add("selected");
	var messages = document.getElementById("messages");
	messages.innerHTML = "";
	var spacer = document.createElement("div");
	spacer.className = "spacer";
	messages.appendChild(spacer);
}

function selectdmchannel(id, name) {
    var infoicon = document.getElementById("infoicon");
	infoicon.style.visibility = "visible";
	infoicon.classList.remove("fa-hashtag");
	infoicon.classList.add("fa-at");
	var title = document.getElementById("channeltitle");
	title.innerHTML = name;
	title.style.visibility = "visible";
	document.getElementById("messageinput").placeholder = "Message @" + name;
	if (document.getElementsByClassName("dmuser selected")[0]) {
		document.getElementsByClassName("dmuser selected")[0].classList.remove("selected");
	}
	document.getElementById(id).classList.add("selected");
	var messages = document.getElementById("messages");
	messages.innerHTML = "";
	var spacer = document.createElement("div");
	spacer.className = "spacer";
	messages.appendChild(spacer);
}

function createjoinmessage(id, uname, joinmsg, owner, discriminator, username, timetext) {
	var body = document.createElement("div");
	body.className = "sysmsg msgbody";
	var msgparts = joinmsg.split("MEMBER");
	msgparts.forEach(function(part, index) {
		body.appendChild(document.createTextNode(part));
		if (msgparts.length != (index + 1)) {
			var unameelem = document.createElement("p");
			unameelem.className = "msguser";
			unameelem.innerHTML = uname;
			unameelem.addEventListener("mouseenter", showUserTooltip);
			unameelem.addEventListener("mouseleave", hideServerTooltip);
			body.appendChild(unameelem);
		}
	})
	createsystemmessage(id, owner, discriminator, username, timetext, body, "fa-arrow-right")
}

function createmessagepinmessage(id, uname, owner, discriminator, username, timetext) {
	var body = document.createElement("div");
	body.className = "sysmsg msgbody";
	var unameelem = document.createElement("p");
	unameelem.className = "msguser";
	unameelem.innerHTML = uname;
	unameelem.addEventListener("mouseenter", showUserTooltip);
	unameelem.addEventListener("mouseleave", hideServerTooltip);
	body.appendChild(unameelem);
	body.appendChild(document.createTextNode(" pinned a message to this channel."));
	createsystemmessage(id, owner, discriminator, username, timetext, body, "fa-thumbtack")
}

function createsystemmessage(id, owner, discriminator, username, timetext, body, iconclass) {
	var msgTest = document.getElementById(id);
	if (msgTest == null) {
		createmessage(id);
	} else {
		msgTest.innerHTML = "";
	}
	var msg = document.getElementById(id);
	msg.className = "message";
	msg.ownerid = owner;
	msg.ownerdiscrim = discriminator;
	msg.ownername = username;
	var icon = document.createElement("i");
	icon.className = "sysmsg fas " + iconclass;
	msg.appendChild(icon);
	var time = document.createElement("p");
	time.className = "msgtime";
	time.innerHTML = timetext;
	body.appendChild(time);
	msg.appendChild(body);
}

function fillmessage(id, uname, avatar, timetext, bodytext, selfmention, isbot, owner, discriminator, username) {
	bodytext = decodeURIComponent(bodytext.replace(/\+/g, ' '));;
	var msgTest = document.getElementById(id);
	if (msgTest == null) {
		createmessage(id);
	} else {
		msgTest.innerHTML = "";
	}
	var msg = document.getElementById(id);
	msg.className = "message";
	msg.ownerid = owner;
	msg.ownerdiscrim = discriminator;
	msg.ownername = username;
	var head = document.createElement("div");
	head.className = "nowrap";
	var ava = document.createElement("img");
	ava.src = avatar;
	ava.className = "msgavatar";
	head.appendChild(ava);
	var unameelem = document.createElement("p");
	unameelem.className = "msguser";
	unameelem.innerHTML = uname;
	unameelem.addEventListener("mouseenter", showUserTooltip);
	unameelem.addEventListener("mouseleave", hideServerTooltip);
	head.appendChild(unameelem);
	if (isbot) {
		var bot = document.createElement("div");
		bot.className = "msgbot"
		bot.innerHTML = "BOT"
		head.appendChild(bot)
	}
	var time = document.createElement("p");
	time.className = "msgtime";
	time.innerHTML = timetext;
	head.appendChild(time);
	msg.appendChild(head);
	var body = document.createElement("div");
	body.className = "msgbody";
	if (selfmention) {
		body.classList.add("selfmention")
	}
	body.innerHTML = bodytext;
	try {
		author = document.getElementById(owner + "-member");
		author.info.messages.push(id);
		if (author.info.colour != null) {
			unameelem.style.color = author.info.colour; 
		}
	} catch (e) {}
	twemoji.parse(body);
	msg.appendChild(body);
	var code = msg.getElementsByTagName("code");
	for (let cblock of code) {
		hljs.highlightBlock(cblock);
	}
}

function appendimgattachment(id, url) {
	var msg = document.getElementById(id);
	var attachcon = document.createElement("div");
	attachcon.classList.add("imageattachment");
	var img = document.createElement("img");
	img.src = url;
	img.setAttribute("onclick", "wv(JSON.stringify({'type': 'openURL', 'content': '"+url+"'}));");
	attachcon.appendChild(img);
	msg.appendChild(attachcon)
}

function appendattachment(id, filename,  url) {
	var msg = document.getElementById(id);
	var attachcon = document.createElement("div");
	attachcon.classList.add("attachment");
	var fileicon = document.createElement("i");
	fileicon.className = "fas fa-file-alt";
	var downloadButton = document.createElement("i");
	downloadButton.className = "fas fa-download";
	downloadButton.setAttribute("onclick", "wv(JSON.stringify({'type': 'openURL', 'content': '"+url+"'}));");
	var filenamebutton = document.createElement("p");
	filenamebutton.innerHTML = filename;
	filenamebutton.setAttribute("onclick", "wv(JSON.stringify({'type': 'openURL', 'content': '"+url+"'}));");
	attachcon.appendChild(fileicon);
	attachcon.appendChild(filenamebutton);
	attachcon.appendChild(downloadButton);
	msg.appendChild(attachcon);
}

function loadhome() {
	document.getElementsByClassName("server selected")[0].classList.remove("selected");
	document.getElementById("home").classList.add("selected");
	document.getElementById("servername").innerHTML = "Home";
	var chancon = document.getElementById("chancontainer");
	chancon.innerHTML = "";
	var head = document.createElement("p");
	head.className = "chanhead";
	head.innerHTML = "DIRECT MESSAGES";
	chancon.appendChild(head);
	document.getElementById("infoicon").style.visibility = "hidden";
	document.getElementById("channeltitle").style.visibility = "hidden";
	document.getElementById("mainbox").style.display = "none";
}

function loadhoistedroles(rolejson) {
	try {
		roles = JSON.parse(rolejson);
	} catch (e) {
		console.error("Error loading roles " + e.toString());
		return;
	}
	var memberbar = document.getElementById("members");
	roles.reverse().forEach(function(role) {
		if (!role.hoist) {return};
		var r = document.createElement("div");
		r.className = "role";
		r.rolename = escapeHtml(role.name);
		r.id = role.id + "-role";
		r.info = role;
		memberbar.insertBefore(r, memberbar.childNodes[0]);
	});
}

function resetmembers() {
	var memberbar = document.getElementById("members");
	memberbar.innerHTML = "";
	var members = document.createElement("div");
	members.className = "role";
	members.rolename = "members";
	members.id = "null-role"
	memberbar.appendChild(members);
}

function setmembercount() {
	var memberbar = document.getElementById("members");
	Array.from(memberbar.children).forEach(function (node) {
		var countelem = node.getElementsByClassName("memberdesc")[0];
		if (countelem != undefined) {
			node.removeChild(countelem);
		}
		var alphasort = Array.from(node.children).sort(function(i, j) {
			if (i.info.nickname.toLowerCase() < j.info.nickname.toLowerCase()) {
				return -1;
			} else {
				return 1;
			}
		})
		alphasort.forEach(function (member) {
			node.appendChild(member);
		})
		countelem = document.createElement("p");
		countelem.className = "memberdesc";
		if (node.children.length == 0) {
			node.style.display = "none";
		}
		countelem.innerHTML = node.rolename.toUpperCase() + "-" + node.children.length;
		node.insertBefore(countelem, node.childNodes[0]);
	})
	new SimpleBar(document.getElementById("members"));
}

function addmember(nickname, src, isbot, id, username, discriminator, colour, hoistroleid, rolejson) {
	var memberbar = document.getElementById(hoistroleid + "-role");
	if (memberbar == null) { memberbar = document.getElementById("null-role"); }
	var member = document.createElement("div");
	member.className = "member";
	var ava = document.createElement("img");
	ava.className = "avatar";
	ava.src = src;
	member.appendChild(ava);
	var memname = document.createElement("p");
	memname.className = "membername";
	memname.innerHTML = nickname;
	if (colour) {
		memname.style.color = colour;	
	}
	member.appendChild(memname);
	if (isbot) {
		var bot = document.createElement("div");
		bot.className = "memberbot"
		bot.innerHTML = "BOT"
		memname.classList.add("shortbot")
		member.appendChild(bot)
	}
	member.id = id + "-member";
	try {
		roles = JSON.parse(rolejson);
	} catch (e) {
		roles = null;
	}
	member.info = {"id": id, "username": username, "discriminator" : discriminator, "nickname" : nickname, "colour" : colour, "roles": roles, "hoist": hoistroleid, "messages" : [] };
	member.addEventListener("mouseenter", showUserTooltip);
	member.addEventListener("mouseleave", hideServerTooltip);
	memberbar.appendChild(member);
}

function openURL(url) {
	wv(JSON.stringify({'type': 'openURL', 'content': url}));
}

function triggerUpload() {
	if (darwin) {
		wv(JSON.stringify({'type': 'sendFile', 'content': ""}));
		return
	}
	document.getElementById("fileupload").click();
}

function completeUpload(files) {
	if (files[0].size > 8388119) {
		createAlert("Upload Failed", "The selected file exceeds the maximum upload size (8mb).");
		document.getElementById("fileupload").value = "";
		return
	}

	var reader = new FileReader();
	var name = files[0].name
	var mime = files[0].type

	reader.onload = function(event) {
		var data = window.btoa(event.target.result) 
		wv(JSON.stringify({'type': 'sendFile', 'content': JSON.stringify({'data': data, 'name': name, 'mime': mime})}));
	}

	reader.onerror = function(event) {
		createAlert("Upload Failed", "Failed to read selected file: " + event.target.error.toString());
	}

	reader.readAsBinaryString(files[0])

	document.getElementById("fileupload").value = "";
}

function showUserTooltip(event) {
	var tooltip = document.getElementById("tooltip");
	tooltip.innerHTML = "";
	tooltip.style.visibility = "hidden";
	tooltip.style.display = "block";
	var nick = document.createElement("p");
	nick.className = "tooltipNick";
	var user = document.createElement("p");
	user.className = "tooltipUser";
	var discriminator = document.createElement("p");
	discriminator.className = "tooltipDiscrim";
	tooltip.appendChild(nick);
	tooltip.appendChild(user);
	tooltip.appendChild(discriminator);
	var rect = event.target.getBoundingClientRect();
	var pageRect = document.body.getBoundingClientRect();
	var isMsg = false;
	if (event.target.className == "msguser") {
		isMsg = true;
		nick.innerHTML = event.target.innerHTML;
		user.innerHTML = event.target.parentNode.parentNode.ownername;
		discriminator.innerHTML = "#" + event.target.parentNode.parentNode.ownerdiscrim;
		var member = document.getElementById(event.target.parentNode.parentNode.ownerid + "-member");
	} else {
		var member = event.target;
	}
	if (member != null) {
		nick.innerHTML = member.info.nickname;
		user.innerHTML = member.info.username;
		discriminator.innerHTML = "#" + member.info.discriminator;
	}
	if (nick.innerHTML == user.innerHTML) {
		tooltip.removeChild(nick);
	}
	if (isMsg) {
		tooltip.style.left = (event.clientX - (event.target.offsetWidth / 2)) + "px";
		if ( (rect.top + event.target.offsetHeight + tooltip.offsetHeight + 5) > pageRect.bottom ) {
			tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + "px";
		} else {
			tooltip.style.top = (rect.top + event.target.offsetHeight + 5) + "px";
		}
	} else {
		tooltip.style.left = (rect.left - tooltip.offsetWidth - 5) + "px";
		if ( ((rect.top - ((tooltip.offsetHeight / 2) - (member.offsetHeight / 2))) + tooltip.offsetHeight )  > pageRect.bottom ) {
			var diff = ((rect.top - ((tooltip.offsetHeight / 2) - (member.offsetHeight / 2))) + tooltip.offsetHeight ) - (pageRect.bottom) + 5;
			tooltip.style.top = ((rect.top - ((tooltip.offsetHeight / 2) - (member.offsetHeight / 2))) - diff ) + "px";
		} else if ( (rect.top - ((tooltip.offsetHeight / 2) - (member.offsetHeight / 2))) < 0 ) {
			tooltip.style.top = 5 + "px";
		} else {
			tooltip.style.top = (rect.top - ((tooltip.offsetHeight / 2) - (member.offsetHeight / 2))) + "px";
		}
	}
	tooltip.style.textAlign = "left";
	tooltip.style.visibility = null;
}

function showServerTooltip(event) {
	var tooltip = document.getElementById("tooltip");
	tooltip.innerHTML = event.target.getElementsByClassName("tooltip-text")[0].innerHTML
	var rect = event.target.getBoundingClientRect();
	tooltip.style.top = (rect.top + 10) + "px";
	tooltip.style.left = (rect.left + 60) + "px";
	tooltip.style.display = "block";
}

function hideServerTooltip() {
	var tooltip = document.getElementById("tooltip");
	tooltip.style = null;
}

var home = document.getElementById("home");
home.addEventListener("mouseenter", showServerTooltip);
home.addEventListener("mouseleave", hideServerTooltip);

window.shiftHeld = false

document.getElementById("messageinput").addEventListener("keyup", function(event) {
	if (event.code === "Enter" && !window.shiftHeld) {
		event.preventDefault();
		var msgInput = document.getElementById("messageinput");
		wv(JSON.stringify({'type': 'sendMessage', 'content': msgInput.value}));
        msgInput.value = "";
	}
	if (event.code === "ShiftLeft") {
		window.shiftHeld = false
	}
});

document.getElementById("messageinput").addEventListener("keydown", function(event) {
	if (event.code === "ShiftLeft") {
		window.shiftHeld = true
	}
	wv("updateTyping");
});

const emoji = document.getElementById('emojiselect');
const picker = new EmojiButton({"style": "twemoji"});
	 
picker.on('emoji', emoji => {
	document.getElementById("messageinput").value += emoji;
});
emoji.addEventListener('click', () => {
	picker.pickerVisible ? picker.hidePicker() : picker.showPicker(emoji);
});

document.getElementById("blocker").style.backgroundColor = "rgba(0,0,0,0.4)";