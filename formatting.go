package main

import (
	"encoding/json"
	"fmt"
	"html"
	"html/template"
	"regexp"
	"strings"

	"github.com/bwmarrin/discordgo"
	"github.com/mvdan/xurls"
)

var emojiAliases = make(map[string]string)

func init() {
	var eAliases struct {
		Emojis []struct {
			Aliases []string `json:"aliases"`
			Unicode string   `json:"unicode"`
		} `json:"emojis"`
	}
	err := json.Unmarshal(MustAsset("ui/assets/emojialiases.json"), &eAliases)
	if err != nil {
		panic(err)
	}
	for _, emoji := range eAliases.Emojis {
		for _, alias := range emoji.Aliases {
			emojiAliases[alias] = emoji.Unicode
		}
	}
}

func formatMentions(c string, m *discordgo.Message) (content string) {
	content = c
	for _, user := range m.Mentions {
		if user.ID == ses.State.User.ID {
			content = strings.NewReplacer(
				"&lt;@"+user.ID+"&gt;", "<div class='selfmention'>@"+html.EscapeString(user.Username)+"</div>",
				"&lt;@!"+user.ID+"&gt;", "<div class='selfmention'>@"+html.EscapeString(user.Username)+"</div>",
			).Replace(content)
			continue
		}
		content = strings.NewReplacer(
			"&lt;@"+user.ID+"&gt;", "<div class='mention'>@"+html.EscapeString(user.Username)+"</div>",
			"&lt;@!"+user.ID+"&gt;", "<div class='mention'>@"+html.EscapeString(user.Username)+"</div>",
		).Replace(content)
	}
	content = strings.NewReplacer(
		"@everyone", "<div class='selfmention'>@everyone</div>",
		"@here", "<div class='selfmention'>@here</div>",
	).Replace(content)
	return
}

func formatMoreMentions(s *discordgo.Session, c string, m *discordgo.Message) (content string, err error) {
	var patternChannels = regexp.MustCompile("&lt;#\\d*&gt;")
	content = c

	if !s.StateEnabled {
		content = formatMentions(c, m)
		return
	}

	channel, err := s.State.Channel(m.ChannelID)
	if err != nil {
		content = formatMentions(c, m)
		return
	}

	for _, user := range m.Mentions {
		nick := user.Username

		member, err := s.State.Member(channel.GuildID, user.ID)
		if err == nil && member.Nick != "" {
			nick = member.Nick
		}
		if user.ID == ses.State.User.ID {
			content = strings.NewReplacer(
				"&lt;@"+user.ID+"&gt;", "<div class='selfmention'>@"+html.EscapeString(user.Username)+"</div>",
				"&lt;@!"+user.ID+"&gt;", "<div class='selfmention'>@"+html.EscapeString(nick)+"</div>",
			).Replace(content)
			continue
		}
		content = strings.NewReplacer(
			"&lt;@"+user.ID+"&gt;", "<div class='mention'>@"+html.EscapeString(user.Username)+"</div>",
			"&lt;@!"+user.ID+"&gt;", "<div class='mention'>@"+html.EscapeString(nick)+"</div>",
		).Replace(content)
	}
	member, _ := s.State.Member(currentServer, s.State.User.ID)
	for _, roleID := range m.MentionRoles {
		role, err := s.State.Role(channel.GuildID, roleID)
		if err != nil || !role.Mentionable {
			continue
		}
		for _, v := range member.Roles {
			if v == roleID {
				content = strings.Replace(content, "&lt;@&amp;"+role.ID+"&gt;", "<div class='selfmention'>@"+html.EscapeString(role.Name)+"</div>", -1)
				continue
			}
		}

		content = strings.Replace(content, "&lt;@&amp;"+role.ID+"&gt;", "<div class='mention'>@"+html.EscapeString(role.Name)+"</div>", -1)
	}

	content = patternChannels.ReplaceAllStringFunc(content, func(mention string) string {
		channel, err := s.State.Channel(mention[5 : len(mention)-4])
		if err != nil || channel.Type == discordgo.ChannelTypeGuildVoice {
			return mention
		}

		return "<div class='mention'>#" + html.EscapeString(channel.Name) + "</div>"
	})
	content = strings.NewReplacer(
		"@everyone", "<div class='selfmention'>@everyone</div>",
		"@here", "<div class='selfmention'>@here</div>",
	).Replace(content)
	return
}

var underline = regexp.MustCompile("__.*__")
var bold = regexp.MustCompile("\\*\\*.*\\*\\*")
var italics = regexp.MustCompile("_.*_")
var italicsalt = regexp.MustCompile("\\*.*\\*")
var strikethrough = regexp.MustCompile("~~.*~~")

func processStyles(c string) (content string) {
	content = c
	var rep = underline.FindAllString(content, -1)
	for _, v := range rep {
		content = strings.Replace(content, v, "<u>"+v[2:len(v)-2]+"</u>", 1)
	}
	rep = bold.FindAllString(content, -1)
	for _, v := range rep {
		content = strings.Replace(content, v, "<b>"+v[2:len(v)-2]+"</b>", 1)
	}
	rep = italics.FindAllString(content, -1)
	rep = append(rep, italicsalt.FindAllString(content, -1)...)
	for _, v := range rep {
		content = strings.Replace(content, v, "<i>"+v[1:len(v)-1]+"</i>", 1)
	}
	rep = strikethrough.FindAllString(content, -1)
	for _, v := range rep {
		content = strings.Replace(content, v, "<s>"+v[2:len(v)-2]+"</s>", 1)
	}
	rep = strings.Split(content, "\n")
	for _, v := range rep {
		if strings.HasPrefix(v, "&gt; ") {
			content = strings.Replace(content, v, "<div class='quoteblock'></div>"+v[4:], 1)
		}
	}
	return
}

var cblockwithlang = regexp.MustCompile("\\x60\\x60\\x60\\w+\\n(.|\\n)+\\x60\\x60\\x60")
var cblock = regexp.MustCompile("\\x60\\x60\\x60(.|\\n)+\\x60\\x60\\x60")
var cblockinline = regexp.MustCompile("\\x60(.|\\n)+\\x60")

func processCodeblocks(c string) (content string) {
	content = c
	var rep = cblockwithlang.FindAllString(content, -1)
	for _, v := range rep {
		syntaxLang := strings.Split(v, "\n")[0][3:]
		content = strings.Replace(content, v, "<pre><code class='"+syntaxLang+"'>"+strings.SplitN(v[:len(v)-3], "\n", 2)[1]+"</code></pre>", 1)
	}
	rep = cblock.FindAllString(content, -1)
	for _, v := range rep {
		content = strings.Replace(content, v, "<pre><code class='plaintext'>"+strings.TrimSuffix(strings.TrimPrefix(v[3:len(v)-3], "\n"), "\n")+"</code></pre>", 1)
	}
	rep = cblockinline.FindAllString(content, -1)
	for _, v := range rep {
		content = strings.Replace(content, v, "<pre style='display: inline;'><code class='plaintext' style='display: inline; padding: 0; border-radius: 0;'>"+v[1:len(v)-1]+"</code></pre>", -1)
	}
	return
}

var customemoji = regexp.MustCompile("&lt;a?:.*&gt;")
var aliasedemoji = regexp.MustCompile(":(\\w)+:")

func processNonUnicodeEmoji(c string) (content string) {
	content = c
	var rep = customemoji.FindAllString(content, -1)
	for _, v := range rep {
		emoji := "https://cdn.discordapp.com/emojis/" + strings.TrimSuffix(strings.Split(v, ":")[2], "&gt;")
		content = strings.Replace(content, v, "<img src='"+emoji+"' class='customemoji'>", 1)
	}
	rep = aliasedemoji.FindAllString(content, -1)
	for _, v := range rep {
		alias := v[1 : len(v)-1]
		unicode, ok := emojiAliases[alias]
		if ok {
			content = strings.Replace(content, v, unicode, 1)
		}
	}
	return
}

var processedCblock = regexp.MustCompile("<pre(.|\\n)+pre>")

func parseMarkdownAndMentions(m *discordgo.Message) (content string) {
	content = processCodeblocks(html.EscapeString(m.Content))
	markdownstrings := processedCblock.Split(content, -1)
	for _, v := range markdownstrings {
		content = strings.Replace(content, v, processStyles(v), 1)
	}
	urlStrings := processedCblock.Split(content, -1)
	for _, v := range urlStrings {
		rep := xurls.Strict.FindAllString(v, -1)
		for _, x := range rep {
			content = strings.Replace(content, x, `<div class='link' onclick=openURL('`+x+`')>`+x+`</div>`, -1)
		}
	}
	mentionstrings := processedCblock.Split(content, -1)
	for _, v := range mentionstrings {
		mention, err := formatMoreMentions(ses, v, m)
		if err != nil {
			mention = formatMentions(v, m)
		}
		content = strings.Replace(content, v, mention, 1)
	}
	emojistrings := processedCblock.Split(content, -1)
	for _, v := range emojistrings {
		content = strings.Replace(content, v, processNonUnicodeEmoji(v), 1)
	}
	return
}

func processEmbed(z *discordgo.MessageEmbed, m *discordgo.Message) (c string) {
	c = `var div = document.createElement("div");
		div.classList.add("embed");
		div.style.borderLeft = "4px solid #` + fmt.Sprintf("%06x", z.Color) + `";
		`
	if z.Provider != nil {
		c += `var provider = document.createElement("div");
				provider.className = "provider";
				provider.innerHTML = "` + template.JSEscapeString(html.EscapeString(z.Provider.Name)) + `";
				provider.setAttribute("onclick", "wv(JSON.stringify({'type': 'openURL', 'content': '` + template.JSEscapeString(html.EscapeString(z.Provider.URL)) + `'}));");
				twemoji.parse(provider);
				div.appendChild(provider);
				`
	}
	if z.Author != nil {
		c += `var author = document.createElement("div");
				author.className = "author";
				author.innerHTML = "` + template.JSEscapeString(html.EscapeString(z.Author.Name)) + `";
				author.setAttribute("onclick", "wv(JSON.stringify({'type': 'openURL', 'content': '` + template.JSEscapeString(html.EscapeString(z.Author.URL)) + `'}));");
				twemoji.parse(author);
				div.appendChild(author);
				`
	}
	if z.Title != "" {
		c += `var title = document.createElement("div");
				title.className = "title";
				title.innerHTML = "` + template.JSEscapeString(html.EscapeString(z.Title)) + `";
				title.setAttribute("onclick", "wv(JSON.stringify({'type': 'openURL', 'content': '` + template.JSEscapeString(html.EscapeString(z.URL)) + `'}));");
				twemoji.parse(title);
				div.appendChild(title);
				`
	}
	if z.Image != nil {
		c += `var imageattach = document.createElement("div");
				imageattach.className = "imageattachment";
				var img = document.createElement("img");
				img.src = "` + template.JSEscapeString(html.EscapeString(z.Image.URL)) + `";
				img.setAttribute("onclick", "wv(JSON.stringify({'type': 'openURL', 'content': '` + template.JSEscapeString(html.EscapeString(z.Image.URL)) + `'}));");
				imageattach.appendChild(img);
				div.appendChild(img);
				`
	}
	if z.Video != nil {
		c += `var vid = document.createElement("iframe");
				vid.src = "` + template.JSEscapeString(html.EscapeString(z.Video.URL)) + `"
				vid.setAttribute("allowfullscreen", "");
				div.appendChild(vid);
				`
	}
	if z.Video == nil && z.Image == nil && z.Thumbnail != nil && z.Description != "" {
		c += `var imageattach = document.createElement("div");
				imageattach.className = "imageattachment";
				var img = document.createElement("img");
				img.style.maxHeight = "80px";
				img.style.maxWidth = "80px";
				img.style.display = "inline-block";
				img.src = "` + template.JSEscapeString(html.EscapeString(z.Thumbnail.URL)) + `";
				img.setAttribute("onclick", "wv(JSON.stringify({'type': 'openURL', 'content': '` + template.JSEscapeString(html.EscapeString(z.Thumbnail.URL)) + `'}));");
				imageattach.appendChild(img);
				div.appendChild(img);
				`
	}
	if z.Video == nil && z.Image == nil && z.Thumbnail != nil && z.Description == "" {
		c += `var imageattach = document.createElement("div");
				imageattach.className = "imageattachment";
				var img = document.createElement("img");
				img.src = "` + template.JSEscapeString(html.EscapeString(z.Thumbnail.URL)) + `";
				img.setAttribute("onclick", "wv(JSON.stringify({'type': 'openURL', 'content': '` + template.JSEscapeString(html.EscapeString(z.Thumbnail.URL)) + `'}));");
				imageattach.appendChild(img);
				div.appendChild(img);
				`
	}
	if z.Video == nil && z.Image == nil && z.Description != "" {
		description := processCodeblocks(html.EscapeString(z.Description))
		markdownstrings := processedCblock.Split(description, -1)
		for _, v := range markdownstrings {
			description = strings.Replace(description, v, processStyles(v), 1)
		}
		urlStrings := processedCblock.Split(description, -1)
		for _, v := range urlStrings {
			rep := xurls.Strict.FindAllString(v, -1)
			for _, x := range rep {
				description = strings.Replace(description, x, `<div class='link' onclick=openURL('`+x+`')>`+x+`</div>`, -1)
			}
		}
		mentionstrings := processedCblock.Split(description, -1)
		for _, v := range mentionstrings {
			mention, err := formatMoreMentions(ses, v, m)
			if err != nil {
				mention = formatMentions(v, m)
			}
			description = strings.Replace(description, v, mention, -1)
		}
		emojistrings := processedCblock.Split(description, -1)
		for _, v := range emojistrings {
			description = strings.Replace(description, v, processNonUnicodeEmoji(v), 1)
		}
		c += `var descrip = document.createElement("div");
				descrip.className = "descrip";
				descrip.innerHTML = "` + template.JSEscapeString(strings.ReplaceAll(description, "\n", "<br />")) + `";
				`
		if z.Thumbnail != nil {
			c += `descrip.style.width = "calc(100% - 90px)";
			`
		}

		c += `
				twemoji.parse(descrip);
				div.appendChild(descrip);
				`
	}
	if z.Footer != nil {
		footer := processCodeblocks(html.EscapeString(z.Footer.Text))
		markdownstrings := processedCblock.Split(footer, -1)
		for _, v := range markdownstrings {
			footer = strings.Replace(footer, v, processStyles(v), 1)
		}
		urlStrings := processedCblock.Split(footer, -1)
		for _, v := range urlStrings {
			rep := xurls.Strict.FindAllString(v, -1)
			for _, x := range rep {
				footer = strings.Replace(footer, x, `<div class='link' onclick=openURL('`+x+`')>`+x+`</div>`, -1)
			}
		}
		mentionstrings := processedCblock.Split(footer, -1)
		for _, v := range mentionstrings {
			mention, err := formatMoreMentions(ses, v, m)
			if err != nil {
				mention = formatMentions(v, m)
			}
			footer = strings.Replace(footer, v, mention, -1)
		}
		emojistrings := processedCblock.Split(footer, -1)
		for _, v := range emojistrings {
			footer = strings.Replace(footer, v, processNonUnicodeEmoji(v), 1)
		}
		c += `var footer = document.createElement("div");
				footer.className = "footer";
				footer.innerHTML = "` + template.JSEscapeString(strings.ReplaceAll(footer, "\n", "<br />")) + `";
				twemoji.parse(footer);
				div.appendChild(footer);
				`
	}
	return
}
