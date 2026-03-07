$(document).ready(function () {
  //Toolbar
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div'
  ).removeClass('float-end');
  $('.toolbar-actions').css({
    display: 'flex',
    'justify-content': 'space-between',
  });

  //Searchbar
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.input-group.float-start.view-search.entitylist-search'
  ).addClass('searchContainer');
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.input-group.float-start.view-search.entitylist-search'
  ).removeClass('input-group pull-left view-search entitylist-search');
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.searchContainer > input'
  ).attr('id', 'list-search-input');
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.searchContainer > input'
  ).attr('placeholder', 'Search Topics');
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.searchContainer > input'
  ).attr('aria-label', 'Search Topics');
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.searchContainer > input'
  ).removeClass('query form-control');

  //Create btns
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.input-group.float-start > a'
  ).attr('href', '/admin-topic-details');
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.input-group.float-start > a'
  ).css({
    'background-color': '#0E51CB',
    'border-radius': '8px',
    width: '150px',
    height: '50px',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    color: '#FFFFFF',
  });

  $('<a class="btn btn-primary float-end action create-action"></a>')
    .clone()
    .prependTo(
      '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.input-group.float-start:nth-child(2)'
    );
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.input-group.float-start:nth-child(2) > a:nth-child(1)'
  ).css({
    'background-color': 'transparent',
    border: 'solid 2px #0E51CB',
    color: '#0E51CB',
    'border-radius': '8px',
    height: '50px',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
  });
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.input-group.float-start:nth-child(2) > a:nth-child(1)'
  ).text('Create a subtopic');
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.input-group.float-start:nth-child(2) > a:nth-child(1)'
  ).attr('href', '/create-subtopic');

  //Table
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-grid > table > tbody > tr > td'
  ).css({
    'background-color': '#fff',
  });

  $('.entitylist').on('loaded', function () {
    console.log('list loaded');
    $(this)
      .children('.view-grid')
      .find('tr[data-id]')
      .each(function (i, e) {
        var id = $(this).attr('data-id');
        if ($(this)[0].children[1].innerHTML === 'Topic') {
          $(this).append(
            '<td class="td-action"><p class="tr-divider">|</p><a class="edit-details-button" href="/edit-topic?id=' +
              id +
              '" >Edit Details</a></td>'
          );
        } else {
          $(this).append(
            '<td class="td-action"><p class="tr-divider">|</p><a class="edit-details-button" href="/edit-subtopic?id=' +
              id +
              '" >Edit Details</a></td>'
          );
        }
      });
  });
});
