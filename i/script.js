let g_Q

navigation.addEventListener('navigate', _=>setTimeout(start, 100))

function start(Q)
{
	document.body.innerHTML = ''; if (!Q) Q = g_Q; else g_Q = Q

	let re, year
	if (re = /year=(\d{4})/.exec(document.location.hash)) { year = re[1] }

	if (year)
	{
		drawYears(Q, year, true).then(a=>{
			drawStatistic('../../db/'+Q+'/'+a.fname)
		})
	} else
		drawTournaments(Q)
}

function drawStatistic(fname)
{
	fetch(fname).then(_=>_.text()).then(st=>{
		const data = toJSON(st)

		data.name = data.entity[data.wikidata].name

		const results = {}
		const teams = {}
		for (let i in data.matches)
		{
			let a = data.matches[i]
			if (results[a.team1] == undefined) results[a.team1] = {}
			if (results[a.team2] == undefined) results[a.team2] = {}
			results[a.team1][a.team2] = a.result

			const r = a.result.split(':')
			_team(teams, a.team1)
			_team(teams, a.team2)
			teams[a.team1].total++
			teams[a.team2].total++
			teams[a.team1].goals += r[0] = parseInt(r[0])
			teams[a.team2].goals += r[1] = parseInt(r[1])
			teams[a.team1].skips += r[1]
			teams[a.team2].skips += r[0]
			if (r[0] > r[1]) { teams[a.team1].wins++; teams[a.team2].fails++; }
			if (r[0] < r[1]) { teams[a.team2].wins++; teams[a.team1].fails++; }
			if (r[0] == r[1]) { teams[a.team1].draws++; teams[a.team2].draws++ }
		}

		let _ = []
		for (let i in teams)
		{
			a = teams[i]
			a.Q    = i
			a.GD   = a.goals - a.skips
			a.PTS  = a.wins * 3 + a.draws
			a.sort = a.PTS * 1000 + a.GD
			_.push(a)
		}
		_.sort((a,b)=>b.sort-a.sort)
		for (let i=0; i<_.length; i++) _[i].position = i+1

		drawTitle(data)
		drawResults(_, data.entity)
		drawCrosstable(results, data.entity)
		drawQuickStatements(_, data.wikidata)
	})
}

function drawTitle(a)
{
	let y1 = a.dateStart, y2 = a.dateEnd
	let st = '<h1><a href="'+a.wikipedia+'">'+a.name+' '+y1+'/'+y2+'</a>'+_wd(a.wikidata)+'</h1>'
	const div = document.createElement('div'); div.innerHTML = st
	document.body.appendChild(div)
}

function drawCrosstable(data, entity)
{
	let teams = []
	for (let i in data) teams.push({...entity[i], Q:i})
	teams.sort((a,b)=>a.name.localeCompare(b.name))
	let st = ''
	st += '<table class="c sm">'
	st += '<tr><th>'; for (let i=0; i<teams.length; i++) st += '<th>'+teams[i].shortName
	for (let i=0; i<teams.length; i++)
	{
		st += '<tr>'
		st += '<th class="l">'+teams[i].name+_wd(teams[i].Q)
		for (let j=0; j<teams.length; j++)
		{
			let r = [], cl=''
			try {
				r = data[teams[i].Q][teams[j].Q].split(':')
				if (r[0] >  r[1]) cl = 'green'
				if (r[0] == r[1]) cl = 'yellow'
				if (r[0] <  r[1]) cl = 'red'
			} catch(e){}
			st += '<td class="'+cl+'">'
			if (i == j) st += '—'
			else st += r.join(':')
		}
	}
	st += '</table>'
	const div = document.createElement('section'); div.innerHTML = st
	document.body.appendChild(div)
}

function drawResults(a, entity)
{
	let st = ''
	st += '<table class="c">'
	st += '<tr>'
		+'<th>Поз'
		+'<th>Команда'
		+'<th>И'
		+'<th>В'
		+'<th>Н'
		+'<th>П'
		+'<th>МЗ'
		+'<th>МП'
		+'<th>РМ'
		+'<th>О'
	for (let i=0; i<a.length; i++)
	{
		st += '<tr>'
			+'<td class="r">'+a[i].position
			+'<td class="l">'+entity[a[i].Q].name
			+'<td>'+a[i].total
			+'<td>'+a[i].wins
			+'<td>'+a[i].draws
			+'<td>'+a[i].fails
			+'<td>'+a[i].goals
			+'<td>'+a[i].skips
			+'<td class="r">'+(a[i].GD>0?'&plus;':'&minus;')+Math.abs(a[i].GD)
			+'<td class="b">'+a[i].PTS
	}
	st += '</table>'
	const div = document.createElement('section'); div.innerHTML = st
	document.body.appendChild(div)
}

function drawQuickStatements(a, Q)
{
	let st = ''
	for (let i=0; i<a.length; i++)
	{
		st += Q
		st += "\tP1923\t" + a[i].Q
		st += "\tP1352\t" + a[i].position
		st += "\tP1355\t" + a[i].wins
		st += "\tP1357\t" + a[i].draws
		st += "\tP1356\t" + a[i].fails
		st += "\tP1351\t" + a[i].goals
		st += "\tP1359\t" + a[i].skips
		st += "\n"
	}
	st = '<textarea>'+st+'</textarea><br><input type="submit" value="Отправить в QuickStatements">'
	const el = document.createElement('form'); el.innerHTML = st
	el.onsubmit = _prepare_qs
	document.body.appendChild(el)
}

async function drawYears(Q, year)
{
	return fetch('../../db/'+Q+'/index.json').then(_=>_.text()).then(st=>{
		let res = {}
		const data = toJSON(st)
		st = '<a href="#">/</a>'
		for (let i=0; i<data.length; i++)
		{
			let cl = ''
			if (data[i].year == year) { cl = 'class="active"'; res = data[i] }
			st += '<a href="#?year='+data[i].year+'"'+cl+'>'+data[i].year+'</a>'
		}
		draw(st, 'nav')
		return res
	})
}

function drawTournaments(Q)
{
	fetch('../../db/'+Q+'/index.json').then(_=>_.text()).then(st=>{
		const data = toJSON(st)
		st = ''
		for (let i=0; i<data.length; i++)
			st += '<li><a href="#?year='+data[i].year+'">'+data[i].name+'</a>'
		draw(st, 'ul')
	})
}

function draw(st, tag = 'div', is_in_head = false)
{
	const el = document.createElement(tag); el.innerHTML = st
	if (is_in_head)
		document.body.insertBefore(el, document.body.firstChild)
	else
		document.body.appendChild(el)
	return el
}


function _team(teams, team)
{
	if (teams[team] == undefined)
		teams[team] = {total:0, wins:0, draws:0, fails:0, goals:0, skips:0}
}

function _prepare_qs(e)
{
	let url = 'https://quickstatements.toolforge.org/#/v1=';
	let st = ''; try { st = e.target.querySelector('textarea').value } catch(e) {}
	st = st.replace(/\t/g, '|').replace(/\n/g, '||')
	st = st.replace(/||.+/, '')
	url += encodeURIComponent(st)
	document.location = url
	return false
}

function _wd(Q)
{
	return '<sup><a href="https://www.wikidata.org/wiki/'+Q+'" target="_blank">[wd]</a></sup>';
}

function toJSON(st)
{
	st = st.replace(/'/g, '"') // вместо одинарных кавычек двойные
	st = st.replace(/\n/g, ' ') // в одну строку
	st = st.replace(/([a-z][a-z0-9]+):/ig, '"$1":') // названия параметров двойные кавычки
	st = st.replace(/,\s+([}\]])/g, '$1') // последняя запятая
	return JSON.parse(st)
}
