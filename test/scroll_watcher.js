var Scroll_watcher = function()
{
	this.elements = []

	this.initialize = function()
	{
		var latest_scroll_top = 0
		$(window).on('scroll', $.proxy(function(event)
		{
			var scroll_top = $(window).scrollTop()
			
			if (scroll_top > latest_scroll_top)
			{
				this.downwards = true
			} 
			else 
			{
				this.downwards = false
			}
			
			latest_scroll_top = scroll_top
			
			$.proxy(this.process_scroll, this)()
		}, 
		this))
	}
	
	this.watching = function(element)
	{
		return this.elements.indexOf(element.node()) >= 0
	}
	
	this.watch = function(element)
	{
		if (this.watching(element))
			return
			
		this.elements.push(element.node())
		this.sort_elements_by_top_offset()
		
		element.data('first_time_with_scroller', true)
		this.check_for_events(element)
	}
	
	this.unwatch = function(element)
	{
		this.elements.remove(element.node())
	}
	
	this.sort_elements_by_top_offset = function()
	{
		this.elements.sort(function(a, b)
		{
			a = $(a).offset().top
			b = $(b).offset().top
			
			if (a < b)
				return -1
			else if (a === b)
				return 0
			else
				return 1
		})
	}
	
	this.process_scroll = function(event)
	{
		if (this.elements.length === 0)
			return
			
		var elements = this.elements
			
		if (!this.downwards)
			elements = this.elements.concat([]).reverse()
		
		elements.forEach(function(element)
		{
			this.check_for_events($(element))
		},
		this)
	}

	this.check_for_events = function(element, options)
	{
		options = options || {}
	
		var top_offset_in_window = element.offset().top - $(window).scrollTop()
		
		var first_time = element.data('first_time_with_scroller')
		if (first_time)
			element.data('first_time_with_scroller', false)
		
		var previous_top_offset_in_window = element.data('top_offset_in_window')
		element.data('top_offset_in_window', top_offset_in_window)
		
		var delta = top_offset_in_window - previous_top_offset_in_window
		
		var window_height = $(window).height()
		var height = element.outerHeight()
		
		var is_visible = top_offset_in_window + height >= 0 && top_offset_in_window < window_height
				
		var top_is_visible = top_offset_in_window >= 0 && top_offset_in_window < window_height
		var bottom_is_visible = top_offset_in_window + height >= 0 && top_offset_in_window + height < window_height
		
		var top_was_visible = false
		var bottom_was_visible = false
		
		// moving upwards = scrolling downwards
		var upwards = this.downwards
		var downwards = !this.downwards
		
		if (first_time)
		{
			if (top_is_visible && bottom_is_visible)
			{
				element.trigger('fully_appears_on_top')
			}
			
			if (is_visible)
			{
				element.trigger('appears_on_bottom', window_height - top_offset_in_window)
			}
		}
		else
		{
			top_was_visible = previous_top_offset_in_window >= 0 && previous_top_offset_in_window < window_height
			bottom_was_visible = previous_top_offset_in_window + height >= 0 && previous_top_offset_in_window + height <= window_height

			if (top_was_visible && !top_is_visible)
			{
				if (upwards)
					element.trigger('disappears_on_top')
				else
					element.trigger('disappears_on_bottom')
			}
		
			if (!top_was_visible && top_is_visible && bottom_is_visible)
			{
				if (downwards)
					element.trigger('fully_appears_on_top')
			}
			
			if (!top_was_visible && is_visible)
			{
				if (upwards)
					element.trigger('appears_on_bottom')
			}
		
			if (previous_top_offset_in_window >= window_height && top_offset_in_window < 0)
				element.trigger('appeared_on_bottom')
			else if (previous_top_offset_in_window + height < window_height && top_offset_in_window >= window_height)
				element.trigger('disappeared_on_bottom')
		}
	}
	
	this.initialize()
}

Array.prototype.remove = function(element)
{
	var i = 0
	while (i < this.length)
	{
		if (this[i] === element)
		{
			this.splice(i, 1)
			continue
		}
		
		i++
	}
}