// assumes jQuery
!function( scope, $ ){

    var HS = scope.HS = {}
      , classy = function( className ){ return 'HS-namegame-' + className }
        // fabricate our container ( overlay the screen entirely )
      , $container = $('<div class="'+classy('container')+'"></div>').css({
            background: 'rgba(0,0,0,0.8)'
          , position:   'absolute'
          , top:        0
          , left:       0
          , width:      $(document).width()
          , height:     $(document).height()
        })
        // fabricate our start page ( welcome, intro + choose batches )
      , $mainPage = $( '<div class="'+classy('mainPage')+'"><h1 style="padding-bottom:20px;">Learn Your Hackers!</h1></div>').css({
            width: '600px'
          , background: '#fff'
          , 'border-radius': '5px'
          , margin: '20px auto'
          , padding: '10px 50px 50px'
        }).appendTo( $container )
        // checkboxes for selecting which batches to pull from for game
      , $startContent = $('<div></div>').appendTo( $mainPage ) 
      , $batchCheckboxes = $('<ul class="'+classy('batchCheckboxes')+'"></ul>').css({
            margin: '10px 0'
        }).appendTo( $startContent )
      , $start = $('<input type="submit" value="start game" />').appendTo( $startContent )
      , $board = $('<div class="'+classy('board')+'"></div>').css({ display: 'table', 'font-size': '14px' })
      , $pics  = $('<div class="'+classy('pics')+'"></div>').appendTo($board)
      , $names = $('<div class="'+classy('names')+'"></div>').appendTo($board).css('clear','both')
      , $next  = $('<input type="submit" value="next" />').css('display','block').css('position','relative').css('bottom','0')

    /**
     * build our dataset, like: { "batch name": { "First Last": { pic: "imgSRC", right: 0, wrong: 0 } } }
     */

    $('#batches').children().each(function(){
        // initialize dataset for this batch
        var $batch = $('ul', this).first()
        var batchName = $batch.prev().html()
        var batch  = HS[batchName] = {}
        // add this batch to our checkboxes
        $batchCheckboxes.append('<li><input type="checkbox" name="batch" value="'+batchName+'" /><label>'+batchName+'</label></li>')
        // add each person to the batch
        $('li.person', $batch).each(function(){
            batch[$('.name a', this).html()] = { pic: $('img', this).attr('src'), right: 0, wrong: 0 }
        })
    })

    /**
     * Prompt users to select batches for inclusion in the game
     */

    // check the first box by default
    $batchCheckboxes.find('input').first().click()
    // append our container and fade it in
    $container.hide().appendTo($('body')).fadeTo( 250, 1 )

    $start.click(function(e){
        var enabled = {}
        $batchCheckboxes.find('input:checked').each(function(){
            enabled[$(this).val()] = true
        })
        for( batch in HS ){
            if( !enabled.hasOwnProperty(batch) ) delete HS[batch]
        }
        $startContent.hide()
        $(this).detach()
        $('.'+classy('scorecard')).hide()

        $mainPage.append( $board )
        nameGame()
    })

    // fisherYates
    function shuffle ( arr ) {
      var i = arr.length, j, tempi, tempj;
      if ( i == 0 ) return false;
      while ( --i ) {
         j = Math.floor( Math.random() * ( i + 1 ) );
         tempi = arr[i];
         tempj = arr[j];
         arr[i] = tempj;
         arr[j] = tempi;
       }
    }
    
    function nameGame(){
        // compile our batches into a big group
        var gameData = {}
        // store a list of names for this round
        var round = []
        for( batch in HS ){
            if( HS.hasOwnProperty(batch) )
                for( person in HS[batch] ){
                    if( HS[batch].hasOwnProperty(person) ){
                        gameData[person] = HS[batch][person]
                        round.push(person)
                    }
                }
        }
        // randomize the order of our round
        shuffle( round )

        renderBoard();
        var roundMatches = []

        function renderBoard(){
            var pics = [], names = [], len = round.length > 4 ? 4 : round.length;

            if( len < 1 ){
                scoreRound();
                return false;
            }

            for( var i = 0; i<len; i++ ){
                var person = round[i];
                pics.push( '<img src="'+gameData[person].pic+'" />' )
                names.push( '<div class="'+classy('person')+'">'+person+'</div>' )
            }
            shuffle( pics )
            shuffle( names )
            for( var i = 0; i<len; i++ ){
                $pics.append( pics[i] )
                $names.append( names[i] )
            }
            var match = { pic: null, name: null }
            var matches = []
            
            $pics.find('img').click(function( e ){
                match.pic = $(this).attr('src')
                match.$pic = $(this)
                if( match.name === null ) $pics.find('img').not( $(this) ).fadeTo( 250, 0.2 )
                scoreMatch()
            })

            $names.find('div.'+classy('person')).click(function(e){
                match.name = $(this).html()
                match.$name = $(this)
                if( match.pic === null ) $names.find('div.'+classy('person')).not( $(this) ).fadeTo( 250, 0.2 )
                scoreMatch()
            })

            $next.unbind('click').click(function(){
                $pics.children().detach()
                $names.children().detach()
                $next.detach()
                renderBoard()
            })

            scoreMatch = function(){
                if( match.pic && match.name ){
                    match.$pic.detach()
                    match.$name.detach()
                    matches.push( match )
                    match = { pic: null, name: null }
                    $pics.find('img').add( $names.find('div') ).css('opacity',1)
                    if( $pics.find('img').length === 1 ){
                        match = { pic:   $pics.find('img').attr('src')
                                , $pic:  $pics.find('img')
                                , name:  $names.find('div.'+classy('person')).html() 
                                , $name: $names.find('div.'+classy('person')) }
                        scoreMatch();
                    }
                    if( $pics.find('img').length === 0 ){
                        for( var i=0,u=matches.length;i<u;i++ ){
                            if( gameData[matches[i].name].pic === matches[i].pic ){
                                gameData[matches[i].name].right++
                                matches[i].win = true
                                $pics.append( $('<div class="'+classy('right')+'" style="float:left;"></div>').append( matches[i].$pic ).append( matches[i].$name.prepend('✔ ') ) )
                            } else {
                                gameData[matches[i].name].wrong++
                                matches[i].win = false
                                var $wrongName;
                                for( var i2=0;i2<u;i2++ ){
                                    if( matches[i].pic === gameData[matches[i2].name].pic )
                                        $wrongName = matches[i2].$name.clone()
                                }
                                $pics.append( $('<div class="'+classy('wrong')+'" style="float:left;"></div>').append( '<img src="'+gameData[matches[i].name].pic+'" />' )
                                                                                                              .append( $wrongName.prepend('✖ ').css('text-decoration','line-through') )
                                                                                                              .append( matches[i].$name ) )
                            }
                            roundMatches.push( matches[i] )
                        }
                        while( i-- ){ round.shift() }
                        $board.append( $next )
                    }
                }
            }

            scoreRound = function(){
                var points = 0;
                for( var i=0,u=roundMatches.length;i<u;i++ ){
                    if( roundMatches[i].win ) points++
                }
                $board.append( $('<div class="'+classy('scorecard')+'"><h2>You got '+points+' right and '+(roundMatches.length-points)+' wrong.</h2></div>') ).append( $start )
            }
        }

    }


}( window, jQuery );