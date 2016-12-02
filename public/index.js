$(document).ready(function() {
	$.getJSON('/langs', function(r) {
		$('select[name="lang"]').find('option').remove();
		$('select[name="lang"]').append('<option value="">All</option');
	
		for (l in r) {
			selected = '';

			if (r[l] == 'English') {
				selected = 'selected';
			}

			$('select[name="lang"]').append('<option ' + selected + ' value="' + r[l] + '">' + r[l] + '</option>');
		}
	});
});
