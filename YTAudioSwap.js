


function YTAudioSwapPlayerState()
{
	
	
}
function YTAudioSwapPlayer(playerArgs)
{
	this.playerState = -1; //not started
	this.ready = -2; //neither component ready
	
	this.audioStart = playerArgs.audioStart || 0;
	this.audioEnd = playerArgs.audioEnd;
	this.videoStart = playerArgs.videoStart || 0;
	this.videoEnd = playerArgs.videoEnd;	
	
	this.onSwitch = playerArgs.events.onSwitch;
	this.onReady = playerArgs.events.onReady;
	
	var thisPtr = this;
	var callStateChangedHandler = function(e){
		if(thisPtr.ready === -2)
		{
			if(e.data === 1) //if audio is past the ads
			{
				thisPtr.ready = -1;
				thisPtr.audioPlayer.pauseVideo();
				thisPtr.playerState = 6; //waiting for video to be ready
				console.log(thisPtr.audioPlayer);
				thisPtr.videoPlayer = new YT.Player('ytas-video', thisPtr.videoPlayerOptions);
				thisPtr.onSwitch();
			}
		}
		else
		{	
			thisPtr.stateChangedHandler.call(thisPtr, e);
		}
	}
	
	var playerVars = {
		autoplay: 1,
		controls: 0,
		iv_load_policy: 3,
		rel: 0,
		showinfo: 0,
		disablekb: 1,
		modestbranding: 1,
		enablejsapi: 1,
	}
	
	const videoPlayerVars = {start: this.videoStart, end: this.videoEnd};
	Object.assign(videoPlayerVars, playerVars);
	this.videoPlayerOptions = {
		videoId: playerArgs.videoId,
		height: playerArgs.height,
		width: playerArgs.width,
		playerVars: videoPlayerVars,
		events: {
			'onStateChange': callStateChangedHandler,
			'onReady': function(){thisPtr._ready.call(thisPtr)}
		}
	};
	
	const audioPlayerVars = {start: this.audioStart, end: this.audioEnd};
	Object.assign(audioPlayerVars, playerVars);
	this.audioPlayerOptions = {
		videoId: playerArgs.audioId,
		height: playerArgs.height,
		width: playerArgs.width,
		playerVars: audioPlayerVars,
		events: {
			'onStateChange':  callStateChangedHandler
		}
	};
	this.audioPlayer = new YT.Player('ytas-audio', this.audioPlayerOptions);
}

YTAudioSwapPlayer.prototype._ready = function()
{
	
	this.videoPlayer.mute();
	
	if(!this.audioEnd)
		this.audioEnd = this.audioPlayer.getDuration();
	if(!this.videoEnd)
		this.videoEnd = this.videoPlayer.getDuration();
	
	this.duration = Math.min(this.videoEnd-this.videoStart, this.audioEnd-this.audioStart);
	
	console.log(this);
	if(this.onReady)
		this.onReady();
}

YTAudioSwapPlayer.prototype.stateChangedHandler = function(e){
	//Determine which player this is
	var thisPlayer, otherPlayer;
	if(e.target == this.videoPlayer)
	{
		thisPlayer = this.videoPlayer;
		otherPlayer = this.audioPlayer;
	}
	else if(e.target == this.audioPlayer)
	{
		thisPlayer = this.audioPlayer;
		otherPlayer = this.videoPlayer;
	}
	else
	{
		console.log(e.target, this.audioPlayer);
	}
	
	console.log(e, this.playerState);
	if(e.data === 0)//ended
	{ 
		this.pause();
		this.playerState = 0;
	}
	else if (e.data === 1)//playing
	{ 
		const otherPlayerState = otherPlayer.getPlayerState();
		
		
		if(otherPlayerState === 1) //if both playing
		{
			this.playerState = 1; //playing
		}
		else if(otherPlayerState === 3) //other player is buffering
		{
			thisPlayer.pauseVideo(); //pause and wait for other player
			this.playerState = 6; //waiting for sync
		}	
		else if(otherPlayerState === 2 && this.playerState === 6) //other player has been waiting
		{
			otherPlayer.playVideo();
		}
		else if(otherPlayerState === 2 && this.playerState === 2 || this.playerState === -1) //other player hasn't been told to play yet
		{
			thisPlayer.pauseVideo();
			this.playerState = 6;
			otherPlayer.playVideo();
		}
		else 
		{
			thisPlayer.pauseVideo();
			console.log("player state changed edgecase");
		}
	}
	else if (e.data === 2){ //paused
		
	}
	else if (e.data === 3){ //buffering
		
	}
	else if (e.data === 5){ //cued
		
	}
}

YTAudioSwapPlayer.prototype.pause = function(){
	this.videoPlayer.pauseVideo();
	this.audioPlayer.pauseVideo();
	this.playerState = 2;
}
YTAudioSwapPlayer.prototype.play = function(){
	this.audioPlayer.playVideo();
}


YTAudioSwapPlayer.prototype.getPlayerState = function()
{
	return this.playerState;
}

YTAudioSwapPlayer.prototype.getDuration = function()
{
	return this.duration;
}

YTAudioSwapPlayer.prototype.getCurrentTime = function()
{
	return this.videoPlayer.getCurrentTime() - this.videoStart; //could use video or audio since it is just a measurement of how much time has passed
}

YTAudioSwapPlayer.prototype.seekTo = function(time)
{
	//this.playerState = -1;
	//this.videoPlayer.pauseVideo();
	//this.audioPlayer.pauseVideo();
	this.videoPlayer.seekTo(this.videoStart + time);
	this.audioPlayer.seekTo(this.audioStart + time);
	//this.play();
}
