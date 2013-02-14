/**
 * Hacker-School name game
 * author: Daniel Espeset <daniel@danielespeset.com>
 * released under the Never Graduate license
 */

// assumes jQuery
!!!function( scope, $ ){

    // for the facilitators
    $("a.batch-emails").remove()

    /**
     * Utilties
     */

    // returns a namespaced CSS classname
    function classy ( className ) { return 'HS-namegame-' + className }
    // returns a new <div> string
    function div  ( className, innerHTML ) { return '<div class="'+classy(className)+'">'+(innerHTML||'')+'</div>' }
    // returns a jQuery extended <div> string with style matching `className` applied
    function $div ( className, innerHTML ) { return $( div.apply( this, arguments ) ).css(styles[className]||{}) }
    // fisherYates array randomization, see: http://www.codinghorror.com/blog/2007/12/the-danger-of-naivete.html
    function shuffle ( arr ) {
      var i = arr.length, j, tempi, tempj
      if ( i === 0 ) return false
      while ( --i ) {
         j = Math.floor( Math.random() * ( i + 1 ) )
         tempi = arr[i]
         tempj = arr[j]
         arr[i] = tempj
         arr[j] = tempi
       }
      return arr // should return something, but redundant -- array is mutated directly.
    }

    /**
     * CSS
     */

    var styles = {
        container: {
            background: 'rgba(0,0,0,1)' // opaque to deter cheating :)
          , position:   'absolute'
          , top:        0
          , left:       0
          , width:      $(document).width()
          , height:     $(document).height()
        }
        , mainPage: {
            width: '600px'
          , background: '#fff'
          , margin: '20px auto'
          , padding: '10px 50px 50px'
          , 'border-radius': '5px'
        }
        , batchCheckboxes: {
            margin: '10px 0'
        }
        , board: { 
            display: 'table'
          , 'font-size': '13px' // support long names like `Nicholas Bergson-Shilcock`
        }
        , pics: {
            margin: '20px 0 0'
        }
        , name: {
            border: '1px solid #aaa'
          , background: '#eee'
          , cursor: 'pointer'
          , 'text-align': 'center'
          , 'font-size': '14px'
          , padding: '3px 0'
        }
        , nextButton: {
            display: 'block'
          , position: 'relative'
          , bottom: 0
        }
        , correct:   { 'float': 'left', background: '#00e837' } // hacker school green.
        , incorrect: { 'float': 'left', background: '#ed4044' }
        , wrongName: { 'text-decoration': 'line-through' }
    }

    /**
     * HTML elems
     */

    // container for the whole shabang ( overlays page )
    var $container = $div('container')
        // start page ( welcome, intro + choose batches )
      , $mainPage  = $div('mainPage','<h1>Learn Your Hackers!</h1>').appendTo( $container )
        // checkboxes for selecting which batches to pull from for game
      , $startContent = $div('startContent').appendTo( $mainPage ) 
      , $batchCheckboxes = $('<ul class="'+classy('batchCheckboxes')+'"></ul>').css(styles.batchCheckboxes).appendTo( $startContent )
        // game board & containers
      , $board = $div('board')
      , $pics  = $div('pics').appendTo($board)
      , $names = $div('names').appendTo($board).css('clear','both')
        // buttons
      , $start = $('<input type="submit" value="start game" />').appendTo( $startContent )
      , $next  = $('<input type="submit" value="next" />').css(styles.nextButton)

    /**
     * Init dataset from DOM, like: { "batch name": { "First Last": { pic: "imgSRC", right: 0, wrong: 0 } } }
     */

    var HS = {}

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
    // append container and fade it in
    $container.hide().appendTo($('body')).fadeTo( 250, 1 )
    // start the game when ready
    $start.click( setupGameState ).click( nameGame )
    // abort the game on escape
    $( document ).on('keydown', function abort( e ){
        if( e.which === 27 ) // esc
            $container.fadeTo( 250, 0, function(){ $(this).detach(); $(document).off('keydown', abort) })
    })
    // scroll to the top of the page if not already there
    $('html,body').animate({
        scrollTop: 0
    }, 250 )

    function setupGameState(){
        $startContent.hide()
        $(this).detach()
        $('.'+classy('scorecard')).hide()

        $mainPage.append( $board )
    }
    
    function nameGame(){
            // all the hackers for this round
        var gameData = {}
            // queue of names to be shown
          , round = []
            // map of enabled batches
          , enabled = {}
            // stores the matches made by the player
          , roundMatches = []
            // transports the match being built
          , match = { pic: null, name: null }
            // stores the player matches during each set of 4
          , matches = []

        // get enabled batches
        $batchCheckboxes.find('input:checked').each(function(){
            enabled[$(this).val()] = true
        })

        // populate gameData
        for( batch in HS ){
            if( enabled.hasOwnProperty(batch) ){
                for( person in HS[batch] ){
                    if( HS[batch].hasOwnProperty(person) ){
                        gameData[person] = HS[batch][person]
                        round.push(person)
                    }
                }
            }
        }

        // randomize! see: http://scoundrelswiki.com/ScoundrelsPatter
        shuffle( round )
        // render the gameboard
        renderBoard()

        function renderBoard(){
            // board data, pics for this set
            var pics = []
                // names for this set
              , names = []
                // set length ( max 4 )
              , len = Math.min( 4, round.length )

            !function setup(){
                // clear our board data
                match = { pic: null, name: null }
                matches = []

                // if there are no more people to identify, score up
                if( len < 1 ) return scoreRound()

                // populate the board data ( pics & names )
                for( var i = 0; i<len; i++ ){
                    var person = round[i]
                    pics.push( '<img src="'+gameData[person].pic+'" />' )
                    names.push( $div( 'name', person ) )
                }

                // Hi diddle diddle, the Queen is in the middle. When the money goes down, the lady can’t be found!
                shuffle( pics )
                // Follow it with your eye as I shuffle. Here it is, and now here, now here, and now—where?
                shuffle( names )

                // show the pictures & names
                for( var i = 0; i<len; i++ ){
                    $pics.append( pics[i] )
                    $names.append( names[i] )
                }

            }()

            /**
             * Event Handlers
             */

            // when pics are clicked, fade out others
            $pics.find('img').click(function( e ){
                match.pic = $(this).attr('src')
                match.$pic = $(this)
                if( match.name === null ) $pics.find('img').css('opacity',1).not( $(this) ).fadeTo( 250, 0.2 )
                scoreMatch()
            })
            // when names are clicked, fade out others
            $names.find('div.'+classy('name')).click(function(e){
                match.name = $(this).html()
                match.$name = $(this)
                if( match.pic === null ) $names.find('div.'+classy('name')).css('opacity',1).not( $(this) ).fadeTo( 250, 0.2 )
                scoreMatch()
            })
            // next board
            $next.unbind('click').click(function(){
                $pics.children().detach()
                $names.children().detach()
                $next.detach()
                renderBoard()
            })

        }

        /**
         * Scoring and Processing
         */

        // when player matches a picture / name pair
        function scoreMatch(){
            // only run when match is finished
            if( match.pic === null || match.name === null ) return false
            // remove matched elements
            match.$pic.detach()
            match.$name.detach()
            // move this match to our completed set
            matches.push( match )
            // reset match transport
            match = { pic: null, name: null }
            // restore full opacity
            $pics.find('img').add( $names.find('div') ).css('opacity',1)
            // if there's only 1 pic / name set remaining on the board, match it automatically.
            if( $pics.find('img').length === 1 ){
                match = { pic:   $pics.find('img').attr('src')
                        , $pic:  $pics.find('img')
                        , name:  $names.find('div.'+classy('name')).html() 
                        , $name: $names.find('div.'+classy('name')) }
                return scoreMatch( match )
            }
            // if there are no remaining matches on the board, show the board results
            return $pics.find('img').length ? true : scoreBoard()
        }

        // when player has matched all 4 sets
        function scoreBoard(){
            for( var i=0,u=matches.length;i<u;i++ ){
                if( gameData[matches[i].name].pic === matches[i].pic ){
                    // YES! Player knows this hacker's name.
                    // +1 right answer for this hacker ( not yet used, but should be weighting the next round )
                    gameData[matches[i].name].right++
                    // mark as correct
                    matches[i].win = true
                    // show result
                    $pics.append( $div('correct').append( matches[i].$pic ).append( matches[i].$name.prepend('✔ ') ) )
                } else {
                    // Hmm... player should probably pair with this hacker ASAP.
                    // +1 wrong answer for this hacker ( not yet used, but should be weighting the next round )
                    gameData[matches[i].name].wrong++
                    // mark as incorrect
                    matches[i].win = false
                    // copy the name they got wrong to show with a strike-through
                    var $wrongName
                    for( var i2=0;i2<u;i2++ ){
                        if( matches[i].pic === gameData[matches[i2].name].pic )
                            $wrongName = matches[i2].$name.clone()
                    }
                    // show result
                    $pics.append( $div('incorrect').append( '<img src="'+gameData[matches[i].name].pic+'" />' )
                                                                                                  .append( $wrongName.prepend('✖ ').css(styles.wrongName) )
                                                                                                  .append( matches[i].$name ) )
                }
                // remember this match for the full round score later
                roundMatches.push( matches[i] )
            }
            // advance the round
            while( i-- ){ round.shift() }
            $board.append( $next )
        }

        // when player has matched all hackers in round
        function scoreRound(){
            // total correct answers
            var points = 0
            for( var i=0,u=roundMatches.length;i<u;i++ ){
                if( roundMatches[i].win ) points++
            }
            // render scorecard & restart button
            $board.append( $div('scorecard','<h2>You got '+points+' right and '+(roundMatches.length-points)+' wrong.</h2>') ).append( $start )
        }

    }


}( window, jQuery );