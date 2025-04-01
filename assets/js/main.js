document.getElementById("ano").textContent = new Date().getFullYear()

function parseValue(value, dimension, viewportSize) {
	if (typeof value === 'string') {
		if (value.endsWith('%'))
			return (parseInt(value.slice(0, -1)) / 100) * dimension
		else if (value.endsWith('vh'))
			return (parseInt(value.slice(0, -2)) / 100) * viewportSize
		else if (value.endsWith('px'))
			return parseInt(value.slice(0, -2))
	}
	return value
}

const scrollListeners = {}
let uniqueId = 1

window.addEventListener('scroll', () => {
	const scrollTop = window.scrollY || document.documentElement.scrollTop
	Object.values(scrollListeners).forEach(listener => {
		clearTimeout(listener.timeoutId)
		listener.timeoutId = setTimeout(() => {
			listener.handler(scrollTop)
		}, listener.options.delay)
	})
})

window.addEventListener('load', () => {
	const scrollTop = window.scrollY || document.documentElement.scrollTop
	Object.values(scrollListeners).forEach(listener => {
		listener.handler(scrollTop)
	})

	setTimeout(function () {
		document.body.classList.remove('is-preload')
	}, 100)
})

function scrollex(selector, options) {
	if (!selector)
		return

	if (selector.dataset.scrollexId)
		return selector

	const settings = Object.assign({
		top: '-20vh',
		bottom: '-20vh',
		delay: 0,
		enter: null,
		leave: null,
		initialize: null,
		terminate: null,
		scroll: null
	}, options)
	
	const handler = (scrollTop) => {
		const viewportHeight = window.innerHeight
		const midScroll = scrollTop + viewportHeight / 2

		const elementRect = selector.getBoundingClientRect()
		const elementHeight = elementRect.height

		const topEdge = elementRect.top + scrollTop + parseValue(settings.top, elementHeight, viewportHeight)
		const bottomEdge = elementRect.top + scrollTop + elementHeight - parseValue(settings.bottom, elementHeight, viewportHeight)

		const isActive = midScroll >= topEdge && bottomEdge >= midScroll

		if (isActive !== selector.dataset.scrollexState) {
			selector.dataset.scrollexState = isActive
			if (isActive)
				settings.enter && settings.enter.call(selector)
			else
				settings.leave && settings.leave.call(selector)
		}

		if (settings.scroll) {
			const progress = (midScroll - topEdge) / (bottomEdge - topEdge)
			settings.scroll.call(selector, progress)
		}
	}

	const listener = {
		id: uniqueId++,
		options: settings,
		handler,
		timeoutId: null
	}

	scrollListeners[listener.id] = listener
	selector.dataset.scrollexId = listener.id

	if (settings.initialize)
		settings.initialize.call(selector)
}

function calculateScrollOffset(selector, options) {
	var element = document.querySelector(selector)
	if (!element)
		return null

	var elementTop = element.getBoundingClientRect().top + window.pageYOffset
	var offset = elementTop - (window.innerHeight - element.offsetHeight) / 2

	if (typeof options.offset === "function")
		offset -= options.offset()
	else
		offset -= options.offset

	return offset
}

function scrolly(selector, options) {
	if (!selector)
		return

	selector.forEach(function (element) {
		var href = element.getAttribute("href")
		if (!href || href.charAt(0) !== "#" || href.length < 2)
			return

		var targetSelector = href
		var scrollOptions = Object.assign({
			anchor: "top",
			easing: "swing",
			offset: 0,
			parent: document.documentElement,
			pollOnce: false,
			speed: 1000
		}, options)

		var cachedOffset = null
		if (scrollOptions.pollOnce)
			cachedOffset = calculateScrollOffset(targetSelector, scrollOptions)

		element.addEventListener("click", function (event) {
			event.preventDefault()

			var scrollTo = cachedOffset !== null ? cachedOffset : calculateScrollOffset(targetSelector, scrollOptions)
			if (scrollTo !== null) {
				scrollOptions.parent.scrollTo({
					top: scrollTo,
					behavior: "smooth"
				})
			}
		})
	})
}

var sidebarLinks = document.getElementById('sidebar').querySelectorAll('a')
sidebarLinks.forEach(function (siderbarLink) {
	siderbarLink.classList.add('scrolly')
	siderbarLink.addEventListener('click', function () {
		if (!siderbarLink.getAttribute('href').startsWith('#'))
			return
	
		sidebarLinks.forEach(function (l) {
			l.classList.remove('active')
		})
	
		siderbarLink.classList.add('active', 'active-locked')
	})
	
	var id = siderbarLink.getAttribute('href')
	var section = document.querySelector(id)
	
	if (!section)
		return
	
	scrollex(section, {
		initialize: function () {
			section.classList.add('inactive')
		},
		enter: function () {
			section.classList.remove('inactive')
					
			if (!Array.from(sidebarLinks).some(el => el.classList.contains('active-locked'))) {
				sidebarLinks.forEach(el => el.classList.remove('active'))
				siderbarLink.classList.add('active')
			}
			else if (siderbarLink.classList.contains('active-locked'))
				siderbarLink.classList.remove('active-locked')
		}
	})
})

scrolly(document.querySelectorAll('.scrolly'), {
	offset: function () {
		if (window.getComputedStyle(sidebarElement).zIndex === '1')
			return sidebarElement.offsetHeight
		return 0
	}
})