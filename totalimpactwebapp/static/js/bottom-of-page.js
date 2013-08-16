// UserVoice JavaScript SDK (only needed once on a page)
(function(){var uv=document.createElement('script');uv.type='text/javascript';uv.async=true;uv.src='//widget.uservoice.com/OQC1qQJBAPv28X1VBsYbw.js';var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(uv,s)})()

// A tab to launch the Classic Widget
UserVoice = window.UserVoice || [];
UserVoice.push(['showTab', 'classic_widget', {
    mode: 'full',
    primary_color: '#cc6d00',
    link_color: '#007dbf',
    default_mode: 'feedback',
    forum_id: 166950,
    tab_label: 'Feedback & Support',
    tab_color: '#ff4d00',
    tab_position: 'middle-right',
    tab_inverted: false
}]);

// run analytics stuff
tiAnalytics = new TiAnalytics(userDict)
