var timingController = (function() {
	function get(stopcode) {
		function expandTiming(timings) {
			var expanded = [];
			timings.forEach(function(line) {
				line.timing.forEach(function(time) {
					if(time === '') {
						return;
					}
					expanded.push({
						line: line.line,
						type: line.type,
						time: time
					});
				});
			});
			expanded.sort(function(a, b) {
				return a.time > b.time;
			});
			return expanded;
		}

		function setTimingFormat() {
			if($('#timing-format')[0].checked) {
				$('.times-by-lines').addClass('hidden');
				$('.times-expanded').removeClass('hidden');
			}
			else {
				$('.times-by-lines').removeClass('hidden');
				$('.times-expanded').addClass('hidden');
			}
		}

		$('#timing-format').on('change', setTimingFormat);

		Promise.all([
			templates.get('timing'),
			sumc.getTiming(stopcode),
			db.getStopname(stopcode)
		]).then(function(values) {
			var template = values[0],
				timings = values[1],
				stopname = values[2];

			// this should be made async
			if(!Array.isArray(timings)) {
				timings = false;
			}
			else {
				timings = timings.map(function(x) {
					return {
						line: +x.lineName,
						type: ['tram', 'bus', 'trolley'][x.type],
						timing: x.timing.split(',') // must sort these parts
					};
				}).sort(function(a, b) {
					return a.line - b.line;
				});
			}

			var params = {
				timings: timings,
				expanded: expandTiming(timings),
				stopcode: stopcode,
				stopname: stopname
			};
			$('#timingContainer').html(template(params));

			setTimingFormat();

			$('#timingContainer .tram').on('click', function(e) {
				var linename = e.target.innerHTML;
				routesController.get(0, linename);
			});
			$('#timingContainer .bus').on('click', function(e) {
				var linename = e.target.innerHTML;
				routesController.get(1, linename);
			});
			$('#timingContainer .trolley').on('click', function(e) {
				var linename = e.target.innerHTML;
				routesController.get(2, linename);
			});
		});
	}

	return {
		get: get
	};
}());
