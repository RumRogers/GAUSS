<script>(function() {with (this[2]) {with (this[1]) {with (this[0]) {return function(event) {window.status=''; return true;
};}}}})</script>
























































































































































































































































































































































































































































































































































































                                        <script>(function() {with (this[2]) {with (this[1]) {with (this[0]) {return function(event) {var i=this.id,s=window.google_iframe_oncopy,H=s&&s.handlers,h=H&&H[i],w=this.contentWindow,d;try{d=w.document}catch(e){}if(h&&d&&(!d.body||!d.body.firstChild)){if(h.call){setTimeout(h,0)}else if(h.match){try{h=s.upd(h,i)}catch(e){}w.location.replace(h)}}
};}}}})</script>
<script>	

function loadSocial(){
	
		$.getScript('http://platform.twitter.com/widgets.js');
		 $.getScript("http://connect.facebook.net/en_US/all.js#xfbml=1", function () {
            FB.init({ status: true, cookie: true, xfbml: true });
        });
        $.getScript('https://apis.google.com/js/plusone.js',function()
        {
         	$(".g-plusone").each(function () {
        		    gapi.plusone.render($(this).get(0));
		        });
        });
	
}
	$(document).ready(function()
	{

		$('a[rel=tooltip]').tooltip({'placement': 'bottom'});
	});
	
$(document).ready(function()
{
	$("#singleupload1").uploadFile({
	url:"http://hayageek.com/examples/jquery/ajax-multiple-file-upload/upload.php"
	});

	$("#singleupload2").uploadFile({
	url:"http://hayageek.com/examples/jquery/ajax-multiple-file-upload/upload.php",
	allowedTypes:"png,gif,jpg,jpeg",
	fileName:"myfile"
	});


	$("#multipleupload").uploadFile({
	url:"http://hayageek.com/examples/jquery/ajax-multiple-file-upload/upload.php",
	multiple:true,
	fileName:"myfile"
	});
	
	var uploadObj = $("#advancedUpload").uploadFile({
	url:"http://hayageek.com/examples/jquery/ajax-multiple-file-upload/upload.php",
	multiple:true,
	autoSubmit:false,
	fileName:"myfile",
	formData: {"name":"Ravi","age":31},
	maxFileSize:1024*100,
	maxFileCount:1,
	dynamicFormData: function()
	{
		var data ={ location:"INDIA"}
		return data;
	},
	showStatusAfterSuccess:false,
	dragDropStr: "<span><b>Faites glisser et déposez les fichiers</b></span>",
    abortStr:"abandonner",
	cancelStr:"résilier",
	doneStr:"fait",
	multiDragErrorStr: "Plusieurs Drag &amp; Drop de fichiers ne sont pas autorisés.",
	extErrorStr:"n'est pas autorisé. Extensions autorisées:",
	sizeErrorStr:"n'est pas autorisé. Admis taille max:",
	uploadErrorStr:"Upload n'est pas autorisé"
	});
	$("#startUpload").click(function()
	{
		uploadObj.startUpload();
	});
	
	var deleteuploadObj = $("#deleteFileUpload").uploadFile({url: "upload.php",
 dragDrop: true,
 fileName: "myfile",
 returnType: "json",
 showDelete: true,
 deleteCallback: function (data, pd) {
     for (var i = 0; i < data.length; i++) {
         $.post("delete.php", {op: "delete",name: data[i]},
             function (resp,textStatus, jqXHR) {
                 //Show Message	
                 alert("File Deleted");
             });
     }
     pd.statusbar.hide(); //You choice.

 }
 });
	
	$("#eventsupload").uploadFile({
	url:"http://hayageek.com/examples/jquery/ajax-multiple-file-upload/upload.php",
	multiple:true,
	fileName:"myfile",
	onSubmit:function(files)
	{
		$("#eventsmessage").html($("#eventsmessage").html()+"<br/>Submitting:"+JSON.stringify(files));
	},
	onSuccess:function(files,data,xhr)
	{
		$("#eventsmessage").html($("#eventsmessage").html()+"<br/>Success for: "+JSON.stringify(data));
		
	},
	afterUploadAll:function()
	{
		$("#eventsmessage").html($("#eventsmessage").html()+"<br/>All files are uploaded");
		
	
	},
	onError: function(files,status,errMsg)
	{
		$("#eventsmessage").html($("#eventsmessage").html()+"<br/>Error for: "+JSON.stringify(files));
	}
	});
	
	
	$("#stylingupload1").uploadFile({
	url:"http://hayageek.com/examples/jquery/ajax-multiple-file-upload/upload.php",
	multiple:true,
	fileName:"myfile",
	showStatusAfterSuccess:false,
	showAbort:false,
	showDone:false,
	});

	$("#stylingupload2").uploadFile({
	url:"http://hayageek.com/examples/jquery/ajax-multiple-file-upload/upload.php",
	multiple:true,
	fileName:"myfile",
	showStatusAfterSuccess:false,
	showAbort:false,
	showDone:false,
	uploadButtonClass:"ajax-file-upload-green"
	});
	
});
</script>
                       <script>

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-37706919-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();
jQuery(document).ready(function($) {
        /* * * CONFIGURATION VARIABLES: EDIT BEFORE PASTING INTO YOUR WEBPAGE * * */
        var disqus_shortname = 'hayageek'; // required: replace example with your forum shortname
		var disqus_loaded=false;
		if($("#disqus_thread").length > 0)
		{
			$(window).scroll(function () 
			{
				if(!disqus_loaded)
				{
				loadSocial();
				/* * * DON'T EDIT BELOW THIS LINE * * */
					var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
					dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
					(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
					disqus_loaded = true;
				}
			});
		}
});
</script>