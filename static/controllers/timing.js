const timingInit = (container, formatCheckbox, autoPoll) => {
	const listTimings = (grouped) => {
		const listed = [];
		grouped.forEach((line) => {
			line.arrivals.forEach((arrival) => {
				const item = {
					name: line.name,
					type: line.vehicle_type,
				};
				Object.assign(item, arrival);
				listed.push(item);
			});
		});

		return listed.sort((a, b) => a.time.replace(/:/g, '') - b.time.replace(/:/g, ''));
	};

	const setTimingFormat = () => {
		if(formatCheckbox.checked) {
			document.querySelectorAll('.times-grouped')
				.forEach(x => x.classList.remove('hidden'));
			document.querySelectorAll('.times-listed')
				.forEach(x => x.classList.add('hidden'));
		} else {
			document.querySelectorAll('.times-grouped')
				.forEach(x => x.classList.add('hidden'));
			document.querySelectorAll('.times-listed')
				.forEach(x => x.classList.remove('hidden'));
		}
	};

	const getTiming = async (code) => {
		const subwayTimetable = await db.getSubwayTimetable(code);
		// subway does not stop where other transport types do
		if(subwayTimetable) {
			return subwayTimetable;
		}
		return sumc.getTiming(code);
	};

	const get = async (code, type, name) => {
		const [template, timings] = await Promise.all([
			templates.get('timing'),
			getTiming(code)
		]);

		let grouped = timings.lines;
		const listed = listTimings(grouped);

		grouped.sort((a, b) => a.name - b.name);

		const index = grouped.findIndex(x => x.vehicle_type === type && x.name === name);
		if(index >= 0 && grouped.length > 0) {
			const viewed = grouped.splice(index, 1);
			viewed[0].separate = true;
			grouped = viewed.concat(grouped);
		}

		const data = {
			name: timings.name,
			code: timings.code,
			timestamp: timings.timestamp_calculated,
			grouped,
			listed,
		};

		container.innerHTML = template(data);
		setTimingFormat();
	};

	const load = (code, type, name) => {
		const loading = document.createElement('H3');
		loading.innerHTML = `Loading timings for stop ${code}`;
		container.insertBefore(loading, container.firstChild);
		get(code, type, name);
	};

	formatCheckbox.addEventListener('change', setTimingFormat);

	let pollTimeout = false;
	const pollNow = () => {
		if(autoPoll.checked && document.hasFocus()) {
			const code = router.getStopcode();
			if(!code) return;
			const [type, name] = router.getLine();
			get(code, type, name);
			pollTimeout = setTimeout(pollNow, 15000);
		} else {
			pollTimeout = false;
		}
	};
	const schedulePoll = () => {
		if(!pollTimeout) {
			pollNow();
		}
	};

	schedulePoll();
	autoPoll.addEventListener('change', schedulePoll);
	document.addEventListener('focus', schedulePoll);

	return {
		load,
	};
};
