/**
 * Author: Nikolay Kuchumov
 * See: github.com/kuchumovn
 */
 
/*
 * Options:
 *
 * container — the "<ul></ul>" list (for example)
 *
 * data — a function returning the content of page No "page".
 * A callback is used to allow Ajax data loading.
 *
 * total — total count of the data items (e.g. total "<li></li>"s in the "<ul></ul>")
 *
 * page — current page
 *
 * page_size — number of data items on page (e.g. number of "<li></li>"s on one page)
 *
 * url — the url of the web page depending on the current data page
 *
 *     default — first page
 *     page — other page ("#{page}" will be replaced with current page number)
 *
 * render (data, container) — the function called to render a data item inside the container ("<li></li>")
 *
 * scroll — enables "endless scrolling"
 *
 *     detector — an element, which triggers loading of the next page, when it appears on the bottom of the screen.
 *     it may say "Loading...", etc.
 *
 *     watcher — a tool object with functions "watch(element)" and "unwatch(element)".
 *     it generates events "appears_on_bottom", "appeared_on_bottom", "disappears_on_bottom" and "disappeared_on_bottom" on the element, 
 *     when it appears/disappears on the top/bottom of the screen.
 *
 *     You may impelement your own scroll watcher. Here I use mine.
 *     It is based on MooTools, so it requires including mootools.core.js on your page.
 *     Also, as every piece of code, my scroll watcher can have its own bugs.
 *     So I give you a choise: either you write your own scroll watcher, or you use mine.
 *
 * beginning — is called when we hit the first page while navigating backwards (to the previous data pages)
 *
 * end — is called when we hit the last page while navigating forwards (to the next data pages)
 *
 * before_page — is called before showing (next or previous) page
 * 
 * after_page — is called after showing (next or previous) page
 * 
 * on_previous — is called when the previous page is requested
 * 
 * on_shown_previous — is called after the previous page is shown
 */
var Web2Scroll = function(options)
{
	//this.options = options
			
	$.fn.node = function() { return this[0] }

	/** Url utilities */
	
	RegExp.escape = function(string)
	{
		var specials = new RegExp("[.*+?|()\\[\\]{}\\\\]", 'g')
		return string.replace(specials, "\\$&")
	}

	function set_value(string, key, value)
	{
		return string.replace(new RegExp(RegExp.escape('#{' + key + '}'), 'g'), value)
	}
	
	function адрес_страницы(page)
	{
		if (!page)
			page = страница
			
		if (page === 1)
			return options.url.default
		
		options.url
		
		return set_value(options.url.page, 'page', page)
	}
	
	function поставить_адрес_этой_страницы()
	{
		поставить_адрес_страницы(страница)
	}
	
	function поставить_адрес_страницы(страница)
	{
		set_url(адрес_страницы(страница))
		на_странице(страница)
	}
	
	function set_url(url)
	{
		if (decodeURI(window.location.href) != decodeURI(url))
			window.history.replaceState({}, "", url)
	}
	
	/** Progress */
	
	var Progress = function(options)
	{
		this.options =
		{
			maximum_width: 0,
			maximum_height: 0,

			maximum: 100
		}

		this.setOptions = function(options)
		{
			this.options = $.extend(this.options, options)
		}

		this.initialize = function(options)
		{
			this.setOptions(options)
			
			var progress = this
			$(function()
			{
				if (!progress.options.vertical && !options.maximum_width)
				{
					progress.set_maximum_width()

					$(window).on('resize.progress_bar', function()
					{
						progress.set_maximum_width()
						progress.update()
					})
				}
				else if (progress.options.vertical && !options.maximum_height)
				{
					progress.set_maximum_height()

					$(window).on('resize.progress_bar', function()
					{
						progress.set_maximum_height()
						progress.update()
					})
				}
			})
		}

		this.set_maximum_width = function()
		{
			this.options.maximum_width = $(window).width()
		}

		this.set_maximum_height = function()
		{
			this.options.maximum_height = $(window).height()
		}

		this.update = function(count)
		{
			if (count)
				this.count = count
			else
				count = this.count
			
			if (!this.options.vertical)
				return this.options.element.width(parseInt(count * this.options.maximum_width / this.options.maximum))

			this.options.element.height(parseInt(count * this.options.maximum_height / this.options.maximum))
		}
		
		this.initialize(options)
	}
	
	/** Pages */
	
	var первая_загрузка_новой_страницы = false
	
	var всего_страниц = Math.ceil(options.total / options.page_size)
		
	if (options.страница)
	{
		if (options.страница < 1)
			options.страница = 1
		else if (options.страница > всего_страниц)
			options.страница = всего_страниц
	}
	else
		options.страница = 1
	
	var progress = (страница - 1) * options.page_size

	var первая_загрузка = true
	
	var самая_ранняя_страница = страница
	
	поставить_адрес_этой_страницы()
	
	function следующая_глава(callback)
	{
		if (!первая_загрузка)
		{
			страница++
		}
			
		первая_загрузка = false
		
		options.data(страница, function(data)
		{
			callback({ строки: data.data, есть_ли_ещё: data.has_more, страница: страница })
		})
	}
	
	function предыдущая_глава(callback)
	{
		if (!самая_ранняя_страница)
			самая_ранняя_страница = страница - 1
		else
			самая_ранняя_страница--
			
		var строки
		var есть_ли_ещё = самая_ранняя_страница > 1

		options.data(самая_ранняя_страница, function(data)
		{
			callback({ строки: data.data, есть_ли_ещё: есть_ли_ещё, страница: самая_ранняя_страница })
		})
	}
	
	function загружена_ли_страница(номер)
	{
		return номер >= самая_ранняя_страница && номер <= страница
	}
	
	var самая_дальняя_посещённая_страница = 0
	// посетить_страницу
	function на_странице(page)
	{
		var height = 100 * (1 / страница)  + '%'
		var top = 100 * (1 / страница) * (page - 1) + '%'
		
		// css smooth animation hack
		if (page > самая_дальняя_посещённая_страница)
		{
			height = '100%'
			самая_дальняя_посещённая_страница = page
		}
		
		$('.you_are_here').css
		({
			height: height,
			top: top,
		})
	}
	
	/** Initialization */
	
	var progress_meter = new Progress
	({
		element: $('.web2scroll.vertical_progress_bar .bar .progress'),
		maximum: options.total,
		vertical: true
	})
	
	if (options.scroll)
		options.scroll.watcher.watch(options.scroll.detector)
	
	function следить_за_первым_на_странице(первый, страница)
	{
		var первое_появление_на_экране = true
		
		function on_appears_on_bottom()
		{
			// css smooth animation hack
			if (первое_появление_на_экране)
			{
				первое_появление_на_экране = false
				return
			}
			
			if (загружена_ли_страница(страница))
				поставить_адрес_страницы(страница)
		}
		
		первый.on('appears_on_bottom', function(event)
		{
			on_appears_on_bottom()
		})
		
		первый.on('appeared_on_bottom', function(event)
		{
			on_appears_on_bottom()
		})

		function on_disappears_on_bottom()
		{
			if (загружена_ли_страница(страница - 1))
				поставить_адрес_страницы(страница - 1)
		}
		
		первый.on('disappears_on_bottom', function(event)
		{
			on_disappears_on_bottom()
		})
		
		первый.on('disappeared_on_bottom', function(event)
		{
			on_disappears_on_bottom()
		})
		
		options.scroll.watcher.watch(первый)
	}
	
	function показать_сколько_ещё_осталось()
	{
		progress_meter.update(progress)
	}
	
	this.next_page = function()
	{
		if (options.scroll)
			options.scroll.watcher.unwatch(options.scroll.detector)
				
		if (options.on_next)
			options.on_next()
			
		следующая_глава(function(глава)
		{
			if (!глава.есть_ли_ещё)
			{
				if (options.scroll)
				{
					options.scroll.watcher.unwatch(options.scroll.detector)
					options.scroll.detector.remove()
				}
				
				if (options.end)
					options.end()
			}
	
			if (options.before_page)
				options.before_page('next', options.container)
				
			var первый
			глава.строки.forEach(function(data_unit)
			{
				var element = $('<li/>')
				options.render(data_unit, element)
				element.appendTo(options.container)
	
				if (!первый)
					первый = element
			})
			
			следить_за_первым_на_странице(первый, глава.страница)
	
			progress += options.page_size
		
			показать_сколько_ещё_осталось()
			
			if (options.after_page)
				options.after_page('next', options.container)
				
			поставить_адрес_этой_страницы()
				
			if (options.scroll)
				options.scroll.watcher.watch(options.scroll.detector)
		})
	}
	
	this.previous_page = function()
	{
		if (options.on_previous)
			options.on_previous()
	
		предыдущая_глава(function(глава)
		{
			var предыдущая_высота_списка = options.container.height()
			
			if (!глава.есть_ли_ещё)
			{
				if (options.beginning)
					options.beginning()
			}
			
			if (options.before_page)
				options.before_page('previous', options.container)
			
			глава.строки.reverse().forEach(function(data_unit)
			{
				var element = $('<li/>')
				options.render(data_unit, element)
				element.prependTo(options.container)
			})
	
			if (options.after_page)
				options.after_page('previous', options.container)
				
			следить_за_первым_на_странице(options.container.find('li:first'), глава.страница)
			
			var высота_добавленных_строк = options.container.height() - предыдущая_высота_списка
			$(window).scrollTop($(window).scrollTop() + высота_добавленных_строк)
			
			if (options.on_shown_previous)
				options.on_shown_previous()
		})
	}
	
	options.scroll.detector.on('appears_on_bottom', this.next_page)
	options.scroll.detector.on('appeared_on_bottom', this.next_page)
	
	// это хак,
	// чтобы обозреватель сам не прокручивал вниз при обновлении страницы
	// работает через раз, хз
	$(function()
	{
		setTimeout(function()
		{
			if (options.scroll)
				options.scroll.detector.trigger('appears_on_bottom')
		}, 1)
	})
}