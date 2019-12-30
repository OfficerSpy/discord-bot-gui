package main

import (
	"encoding/json"
	"fmt"
	"html"
	"html/template"
	"log"
	"net"
	"net/http"
	"strings"

	"github.com/asticode/go-astilectron"
	"github.com/gorilla/mux"
)

type route struct {
	Name        string
	Method      string
	Pattern     string
	HandlerFunc http.HandlerFunc
}

type uiMsg struct {
	Type    string `json:"type"`
	Content string `json:"content"`
}

var routes = []route{
	route{"Login", "GET", "/", loginPage}, route{"Lbg", "GET", "/loginbg.jpg", lbg}, route{"DefAva", "GET", "/default.png", defaultavatar},
}

var wvCallbacks map[string]func()

var evalQueue = make(chan string)

func init() {
	wvCallbacks = make(map[string]func())

	wvCallbacks["loginSetup"] = loginSetup
}

func newRouter() *mux.Router {
	router := mux.NewRouter()
	for _, route := range routes {
		router.
			Methods(route.Method).
			Path(route.Pattern).
			Name(route.Name).
			Handler(route.HandlerFunc)
	}
	return router
}

func loginPage(rw http.ResponseWriter, r *http.Request) {
	_, err := rw.Write(MustAsset("ui/login.html"))
	if err != nil {
		log.Fatal(err)
	}
}

func lbg(rw http.ResponseWriter, r *http.Request) {
	_, err := rw.Write(MustAsset("ui/assets/loginbg.jpg"))
	if err != nil {
		log.Fatal(err)
	}
}

func defaultavatar(rw http.ResponseWriter, r *http.Request) {
	_, err := rw.Write(MustAsset("ui/assets/default-avatar.png"))
	if err != nil {
		log.Fatal(err)
	}
}

func serveHTTP(ln net.Listener) {
	router := newRouter()
	if err := http.Serve(ln, router); err != nil {
		if !strings.Contains(err.Error(), "use of closed network connection") {
			panic(err)
		}
	}
}

func eval(x string) {
	evalQueue <- x
}

func evaulator() {
	var done = make(chan bool)
	for {
		jscript := <-evalQueue
		msg := uiMsg{}
		msg.Type = "eval"
		msg.Content = jscript
		m, _ := json.Marshal(msg)
		wv.SendMessage(string(m), func(m *astilectron.EventMessage) {
			done <- true
		})
		<-done
	}
}

func loginSetup() {
	eval(string(MustAsset("ui/js/login.js")))
	eval(fmt.Sprintf(`(function(css){
		var style = document.createElement('style');
		var head = document.head || document.getElementsByTagName('head')[0];
		style.setAttribute('type', 'text/css');
		if (style.styleSheet) {
			style.styleSheet.cssText = css;
		} else {
			style.appendChild(document.createTextNode(css));
		}
		head.appendChild(style);
	})("%s")`, template.JSEscapeString(string(MustAsset("ui/login.css")))))
}

func mainSetup() {
	eval(fmt.Sprintf(`(function(css){
		var style = document.createElement('style');
		var head = document.head || document.getElementsByTagName('head')[0];
		style.setAttribute('type', 'text/css');
		if (style.styleSheet) {
			style.styleSheet.cssText = css;
		} else {
			style.appendChild(document.createTextNode(css));
		}
		head.appendChild(style);
	})("%s")`, template.JSEscapeString(string(MustAsset("ui/main.css")))))
	eval(string(MustAsset("ui/js/main.js")))
	eval(fmt.Sprintf(`
		document.getElementById("cname").innerHTML = %q;
		document.getElementById("cdiscriminator").innerHTML = '#%s';
		document.getElementById("cavatar").src = %q;
	`, html.EscapeString(ses.State.User.Username), ses.State.User.Discriminator, ses.State.User.AvatarURL("128")))
	loadServers()
	loadDMMembers()
}

func (m mainBind) Home() {
	currentServer = "HOME"
	currentChannel = ""
	//wv.Dispatch(func() {
	//	wv.Eval(`loadhome()`)
	//		loadDMMembers()
	//	})
}
