const axios = require("axios").default;

export default (editor, opts = {}) => {
    const pn = editor.Panels;        
    const cmd = editor.Commands;
    const config = editor.getConfig(); 
    const pfx = config.stylePrefix;
    let headerScript = "";
    let bodyScript = "";
    let headerEditor;
    let bodyEditor;   
    cmd.add("addScriptHeader", {
        run(editor, sender){
            const modal = editor.Modal;            
            this.cm = editor.CodeManager || null;            
            if(!this.$editors){
                const $editors = $(`<div class="${pfx}additional-scripts" ></div>`);     
                const tab = $(`<ul class="nav nav-tabs"  role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="script-tab" data-bs-target="#script-content" type="button" role="tab" data-bs-toggle="tab" aria-selected="true" aria-controls="script-content">Script</button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="other-tab" data-toggle="tab" data-bs-target="#other-content" type="button" role="tab" data-bs-toggle="tab" aria-selected="false" aria-controls="other-content">Other</button>
                                </li>
                            </ul>`);
                const scriptArea = $(`<div class="${pfx}script-area tab-pane fade show active" id="script-content" role="tabpanel" aria-labelledby="script-tab" tabindex="0"></div>`);
                const headerComponent = this.buildBeforeHeaderEditor("htmlmixed", "hopscotch", "Before &#60;/head&#62; tag");
                const bodyComponent = this.buildBeforeBodyEditor("htmlmixed", "hopscotch", "Before &#60;/body&#62; tag");
                const otherArea =  $(`<div class="${pfx}script-area tab-pane fade" id="other-content" role="tabpanel" aria-lablledby="other-tab" tabindex="0">abc</div>`);    
                const tabContent = $(`<div class="tab-content"></div>`);        
                // htmlEditor = {
                //     test: headerComponent.content,
                //     ...htmlEditor
                // }
                $editors.append(tab);
                scriptArea.append(headerComponent.content);
                scriptArea.append(bodyComponent.content);
                tabContent.append(scriptArea);
                tabContent.append(otherArea);
                $editors.append(tabContent);
                // $editors.append(headerComponent.content);
                // $editors.append(bodyComponent.content);
                this.$editors = $editors;                
            }
            // console.log(this.$editors);
            modal.open({                
                title: "Additional scripts",
                content: this.$editors,
                attributes: {
                    class: "additional-script"
                }
            }).getModel().once("change:open", () => editor.stopCommand(this.id));
        },
        stop(editor){
            const modal = editor.Modal;
            modal && modal.close();
        },
        buildBeforeHeaderEditor(codeName, theme, label){
            if(!this.codeViewer1){
                this.codeViewer1 = this.cm.createViewer({
                    codeName: codeName,
                    theme: theme,
                    readOnly: false
                });
            }
            headerEditor = this.codeViewer1;
            const content = document.createElement("div");
            content.innerHTML = `<div class='modal-title'>${label}</div>`;
            content.appendChild(this.codeViewer1.getElement());
            return {content};
        },
        buildBeforeBodyEditor(codeName, theme, label){
            if(!this.codeViewer2){
                this.codeViewer2 = this.cm.createViewer({
                    codeName: codeName,
                    theme: theme,
                    readOnly: false
                });
            }
            bodyEditor = this.codeViewer2;
            const content = document.createElement("div");
            content.innerHTML = `<div class='modal-title'>${label}</div>`;
            content.appendChild(this.codeViewer2.getElement());
            return {content};
        }
    });
    cmd.add("saveLandingPage", {
        run(editor, sender){
            headerScript = headerEditor ? headerEditor.getContent() : "";          
            bodyScript = bodyEditor ? bodyEditor.getContent() : "";
            var req = {
                "headerScript": headerScript,
                "bodyContent": JSON.stringify(editor.getProjectData())
            };
            if(opts.action === "edit"){
                req.id = opts.id;
            }
            var data = JSON.stringify(req);    
            let url = 'http://127.0.0.1:3000/api/landingpage/create';
            if(opts.action === "edit"){
                url = 'http://127.0.0.1:3000/api/landingpage/update';
            }
            var config = {
                method: 'post',
                url: url,
                headers: { 
                    'Content-Type': 'application/json'
                },
                data : data
            };
            
            axios(config)
            .then(function (response) {
                // console.log(JSON.stringify(response.data));
            })
            .catch(function (error) {
                console.log(error);
            });
        }
    });
    cmd.add("publishLandingPage", {
        //save before publishing
        run(editor, sender){
            // editor.runCommand("saveLandingPage");
            //display domain popup
            const url = 'http://127.0.0.1:3000/api/domain/list?size=50&index=0';
            var request = {
                method: 'get',
                url: url,
                headers: { 
                    'Content-Type': 'application/json'
                }
            };
            axios(request)
            .then(function (response) {
                const domains = response.data.items;
                $("<div></div>").dialog({
                    modal: true,
                    title: "Choose a domain",
                    create: function(event, ui){
                        var widget = $(this).dialog("widget");
                        $(".ui-dialog-title-bar-close span", widget).removeClass("ui-icon-closethick")
                        .append('<i class="fa fa-window-close-o" aria-hidden="true"></i>');
                    },
                    open: function(){                    
                        let content = `
                            <select id="combobox">
                                <option value>Select one...</option>                
                        `;
                        for(let i = 0; i < domains.length; i++){
                            content = content + `<option value="${domains[i].domain}">${domains[i].domain}</option>`;
                        }
                        content = content + `</select>`;
                        $(this).html(content);
                        $("#combobox").combobox();
                    },
                    buttons: {
                        Ok: function(){
                            $("#combobox").remove();
                            $(this).dialog("close");
                        }
                    },
                    close: function(event, ui){
                        $("#combobox").remove();
                    }
                });
            })
            .catch(function (error) {
                console.log(error);
            });            
        }
    });
    //add to the top panel, in "options" component
    pn.addButton("options", {
        id: "gjs-header",
        className: "fa fa-file-code-o",
        attributes: {
            title: "Add header's scripts"
        },
        command: "addScriptHeader"//e => e.runCommand("addScriptHeader")
    });
    //add save button in header popup
    let btnSave = document.createElement("button");
    let btnLabel = "Close";
    btnSave.innerHTML = btnLabel;
    btnSave.className = `${pfx}btn-prim`;
    //we only add this button when addScriptHeader command is run
    editor.on("run:addScriptHeader", () => {        
        editor.Modal.getContentEl().appendChild(btnSave);  
        btnSave.onclick = () => {            
            // editor.runCommand("saveHeaderScript");
            //just close the editor
            editor.Modal.close();
        };      
    });
    pn.addButton("options", {
        id: "gjs-publish",
        className: "fa fa-cloud-upload",
        attributes: {
            title: "Publish"
        },
        command: "publishLandingPage"
    });
    pn.addButton("options", {
        id: "gjs-save",
        className: "fa fa-floppy-o",
        attributes: {
            title: "Save"
        },
        command: "saveLandingPage"
    })
  }