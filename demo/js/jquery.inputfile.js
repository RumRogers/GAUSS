/*jslint browser:true */
/*global jQuery */

(function ($) {

	"use strict";

	var methods = {},
		BASE_CLASS = 'inputfile',
		BUTTON_CLASS = 'upload-button',
		PREVIOUS_CLASS = 'previous-file',
		DELETED_CLASS = 'deleted',
		LINK_CLASS = 'upload-button-link',
		REMOVE_CLASS = 'upload-button-remove';
	
	function selectFile(evt) {
		
		var $input = $(evt.currentTarget),
			$base = $input.parents('.' + BASE_CLASS),
			$div = $base.find('.' + PREVIOUS_CLASS),
			$link = $div.find('a'),
			$checkbox = $base.find('input[type="checkbox"]');
		
		$div.show();
		
		$checkbox.attr('disabled', 'disabled');
		$div.removeClass(DELETED_CLASS);
		
		$link.attr('href', '#');
        //$link.html($input.val());
		$link.html($input.val().split('C:\\fakepath\\')[1]);
        $link.on('click', function () { return false; });
	}
	
	function removeSelectedFile(evt) {
		var $button = $(evt.currentTarget),
            $base = $button.parents('.' + BASE_CLASS),
            $file = $base.find('input[type="file"]'),
			$parent = $button.parent(),
            $link = $parent.find('a'),
			$checkbox = $base.find('input[type="checkbox"]');
		
        if ($file.attr('data-value')) {
            if ($parent.hasClass(DELETED_CLASS)) {
                $checkbox.removeAttr('checked');
                $checkbox.attr('disabled', 'disabled');
                
                $parent.removeClass(DELETED_CLASS);
            } else {
                
                if ($link.attr('href') !== $file.attr('data-value')) {
                    $link.attr('href', $file.attr('data-value'));
                    $link.html($file.attr('data-text'));
                } else {
                    $checkbox.attr('checked', 'checked');
                    $checkbox.removeAttr('disabled');
                    
                    $parent.addClass(DELETED_CLASS);
                }
            }
            
        } else {
            $parent.hide();
            $parent.addClass(DELETED_CLASS);
            
            $checkbox.removeAttr('disabled', 'disabled');
            $link.html('');
            $file.replaceWith($file.clone(true));
        }
        
		return false;
	}
	
	function init(params) {
		
		this.each(function () {
		
			var $self = $(this),
				fileUrl = $self.data('value'),
				fileText = $self.data('text'),
				config = $.extend({}, $self.inputfile.config, params),
				$button,
				$base,
				$previous,
				$link,
				$remove,
				removeName,
				$checkbox,
				$fileButton;
			
			// Set the html
			$self.wrap('<div class="' + BASE_CLASS + '"><div class="' + BUTTON_CLASS + '"></div></div>');
			
			$button = $self.parent();
			$base = $button.parent();

			$previous = $('<div class="' + PREVIOUS_CLASS + '"></div>').prependTo($base);
			$link = $('<a href="#" class="' + LINK_CLASS + '" target="_blank"></a>').appendTo($previous);
			
            if (!params.dontRemove) {
                $remove = $('<button class="' + REMOVE_CLASS + ' ' + config.removeButtonClass + '"></button>').appendTo($previous);
                
                $remove.append($(config.removeText).addClass('remove-icon'));
                $remove.append($(config.restoreText).addClass('restore-icon'));
                
                removeName = config.removeName || $self.attr('name');
                $checkbox = $('<input type="checkbox" name="' + removeName + '" value="' + config.removeValue + '" disabled/>');
                
                $checkbox.hide().appendTo($remove);
            }
			
			if (!fileUrl) {
				$previous.hide();
			} else {
				$link.attr('href', fileUrl);
				$link.html(fileText || fileUrl);
			}

            $fileButton = $('<button class="' + config.uploadButtonClass + '">' + config.uploadText + '</button>').insertBefore($self);
			
			// Event listeners
			$self.on('change', selectFile);
            
            if ($remove) {
                $remove.on('click', removeSelectedFile);
            }
		});
	}
	
	$.fn.inputfile = function (method) {

		if (methods[method]) {
			return methods[method].apply($(this), Array.prototype.slice.call(arguments, 1));
		} else if (!method || (method && method.constructor === Object)) {
			return init.apply(this, arguments);
		}
	};
	
	$.fn.inputfile.config = {
		uploadText: '<i class="icon-upload"></i> Upload file',
		removeText: '<i class="icon-trash"></i>',
		restoreText: '<i class="icon-undo"></i>',
		
		uploadButtonClass: 'btn',
		removeButtonClass: 'btn',
		
		removeName: '',
		removeValue: 1,
        
        dontRemove: false
	};

}(jQuery));