var assert = require('assert')

var parser = require('../models/queryParser')

const pairs = [
  ['([a,b],c)', 'f(((a,b) => c)).'],
  ['([aAv,bxxs],cDs)', 'f(((aAv,bxxs) => cDs)).'],
  ['([a,b],c)', 'f(((a,b) => c)).'],
  ['([aAv,bxxs],cDs)', 'f(((aAv,bxxs) => cDs)).'],
  ['([a,b],c)', 'f(((a,b) => c)).'],
  ['([aAv,bxxs],cDs)', 'f(((aAv,bxxs) => cDs)).'],
  ['([(~ a),b],c)', 'f((((~ a),b) => c)).'],
  ['([(~  a), (Id b)],c)','f((((~ a),((# 1^d: b))) => c)).'],
  ['([(~  a), (Id^1 b)],c)','f((((~ a),((# 3^d: b))) => c)).'],
  ['([(~  a), (Aw b)],c)','f((((~ a),((# 2^d: ~ b))) => c)).'],
  ['([(~  a), (Aw^1 b)],c)','f((((~ a),((# 4^d: ~ b))) => c)).'],
  ['([(~  a), (Ob b)],c)','f((((~ a),(((# 1^d: b), (# 2^d: ~ b)))) => c)).'],
  ['([(~  a), (Ob^1 b)],c)','f((((~ a),(((# 3^d: b), (# 4^d: ~ b)))) => c)).'],
  ['([(~  a), (Fb b)],c)','f((((~ a),(((# 1^d: (~ b)), (# 2^d: ~ (~ b))))) => c)).'],
  ['([(~  a), (Fb^1 b)],c)','f((((~ a),(((# 3^d: (~ b)), (# 4^d: ~ (~ b))))) => c)).'],
  ['([(~  a), (Pm b)],c)','f((((~ a),(((* 1^d: b), (* 2^d: ~ b)))) => c)).'],
  ['([(~  a), (Pm^1 b)],c)','f((((~ a),(((* 3^d: b), (* 4^d: ~ b)))) => c)).'],
  ['([a,(b; d)],c)', 'f(((a,(b;d)) => c)).'],
  ['([a,(b, d)],c)', 'f(((a,(b,d)) => c)).'],
  ['([a,(b => d)],c)', 'f(((a,(b=>d)) => c)).'],
  ['([a,(b <=> d)],c)', 'f(((a,(b<=>d)) => c)).'],
  ['([(~  a), (b O> d)],c)', 'f((((~ a),(((b => ((# 1^d: d), (# 2^d: ~ d))),((# 1^d: ((# 1^d: b), (# 2^d: ~ b))) => (# 1^d: ((# 1^d: d), (# 2^d: ~ d))))))) => c)).'],
  ['([(~  a), (b P> d)],c)','f((((~ a),(((b => ((* 1^d: d), (* 2^d: ~ d))),((# 1^d: ((* 1^d: b), (* 2^d: ~ b))) => (# 1^d: ((* 1^d: d), (* 2^d: ~ d))))))) => c)).'],
  ['([(~  a), (b O>^1 d)],c)', 'f((((~ a),(((b => ((# 3^d: d), (# 4^d: ~ d))),((# 3^d: ((# 3^d: b), (# 4^d: ~ b))) => (# 3^d: ((# 3^d: d), (# 4^d: ~ d))))))) => c)).'],
  ['([(~  a), (b P>^1 d)],c)','f((((~ a),(((b => ((* 3^d: d), (* 4^d: ~ d))),((# 3^d: ((* 3^d: b), (* 4^d: ~ b))) => (# 3^d: ((* 3^d: d), (* 4^d: ~ d))))))) => c)).'],
  ['([(~  a), (b O>^2 d)],c)', 'f((((~ a),(((b => ((# 5^d: d), (# 6^d: ~ d))),((# 5^d: ((# 5^d: b), (# 6^d: ~ b))) => (# 5^d: ((# 5^d: d), (# 6^d: ~ d))))))) => c)).'],
  ['([(~  a), (b P>^2 d)],c)','f((((~ a),(((b => ((* 5^d: d), (* 6^d: ~ d))),((# 5^d: ((* 5^d: b), (* 6^d: ~ b))) => (# 5^d: ((* 5^d: d), (* 6^d: ~ d))))))) => c)).'],
  ['([(~  a), (b F> d)],c)', 'f((((~ a),(((b => ((# 1^d: (~ d)), (# 2^d: ~ (~ d)))),((# 1^d: ((# 1^d: (~ b)), (# 2^d: ~ (~ b)))) => (# 1^d: ((# 1^d: (~ d)), (# 2^d: ~ (~ d)))))))) => c)).'],
  ['(c)', 'f((c)).'],
  ['([((Ob X) => (Ob^1 X))],c)','f(((((((# 1^d: X__var), (# 2^d: ~ X__var)))=>(((# 3^d: X__var), (# 4^d: ~ X__var))))) => c)).'],
  ['([((Ob X) => (Ob^[x,y] X))],c)','f(((((((# 1^d: X__var), (# 2^d: ~ X__var)))=>(((# 2661^d: X__var), (# 2662^d: ~ X__var))))) => c)).'],
  ['([  a    ,   b   ] , c     )', 'f(((a,b) => c)).']
];

const pairs2 = [
  ['(((((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z)) O> communicate_at_time(Y,W,T,contact_details(Y))) , (((((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z)) , representative(K,Y)) O> communicate_at_time(Y,W,T,contact_details(K))))', '(all X__var:all Y__var:all Z__var:all T__var:all W__var:all K__var:(((((((((processor(X__var),nominate(Y__var,X__var)),personal_data_processed_at_time(X__var,Z__var,T__var)),personal_data(Z__var,W__var)),data_subject(W__var)),controller(Y__var,Z__var)) => ((# 1^d: communicate_at_time(Y__var,W__var,T__var,contact_details(Y__var))), (# 2^d: ~ communicate_at_time(Y__var,W__var,T__var,contact_details(Y__var))))),((# 1^d: ((# 1^d: (((((processor(X__var),nominate(Y__var,X__var)),personal_data_processed_at_time(X__var,Z__var,T__var)),personal_data(Z__var,W__var)),data_subject(W__var)),controller(Y__var,Z__var))), (# 2^d: ~ (((((processor(X__var),nominate(Y__var,X__var)),personal_data_processed_at_time(X__var,Z__var,T__var)),personal_data(Z__var,W__var)),data_subject(W__var)),controller(Y__var,Z__var))))) => (# 1^d: ((# 1^d: communicate_at_time(Y__var,W__var,T__var,contact_details(Y__var))), (# 2^d: ~ communicate_at_time(Y__var,W__var,T__var,contact_details(Y__var)))))))),(((((((((processor(X__var),nominate(Y__var,X__var)),personal_data_processed_at_time(X__var,Z__var,T__var)),personal_data(Z__var,W__var)),data_subject(W__var)),controller(Y__var,Z__var)),representative(K__var,Y__var)) => ((# 1^d: communicate_at_time(Y__var,W__var,T__var,contact_details(K__var))), (# 2^d: ~ communicate_at_time(Y__var,W__var,T__var,contact_details(K__var))))),((# 1^d: ((# 1^d: ((((((processor(X__var),nominate(Y__var,X__var)),personal_data_processed_at_time(X__var,Z__var,T__var)),personal_data(Z__var,W__var)),data_subject(W__var)),controller(Y__var,Z__var)),representative(K__var,Y__var))), (# 2^d: ~ ((((((processor(X__var),nominate(Y__var,X__var)),personal_data_processed_at_time(X__var,Z__var,T__var)),personal_data(Z__var,W__var)),data_subject(W__var)),controller(Y__var,Z__var)),representative(K__var,Y__var))))) => (# 1^d: ((# 1^d: communicate_at_time(Y__var,W__var,T__var,contact_details(K__var))), (# 2^d: ~ communicate_at_time(Y__var,W__var,T__var,contact_details(K__var))))))))))']
];
describe("Query parser", function(){
  it(`should parse the strings in ${pairs} correctly`, function(done){
    for(var i = 0 ; i < pairs.length; i++) {
      assert.equal(parser.parse(pairs[i][0]), pairs[i][1]);
    }
    done();
  });
  it(`should parse the strings in ${pairs2} correctly (for formulae)`, function(done){
    for(var i = 0 ; i < pairs2.length; i++) {
      assert.equal(parser.parseFormula(pairs2[i][0]), pairs2[i][1]);
    }
    done();
  });
  it(`should parse the a complex GDPR article 13 query correctly`, function(done){
      let f = '(((((((((((~ already_has(Subject, contact_details(Controller))) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data))) O> communicate_at_time(Controller, Subject, Time, contact_details(Controller))) , ((((~ already_has(Subject, contact_details(Representive))) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data))) , representive(Controller, Representive)) O> communicate_at_time(Controller, Subject, Time, contact_details(Representive)))) , ((((~ already_has(Subject, contact_details(DPO))) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data))) , data_protection_officer(DPO,Data)) O> communicate_at_time(Controller, Subject, Time, contact_details(DPO)))) , (((~ already_has(Subject, purpose_of_processing(Purpose, Data))) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data))) O> communicate_at_time(Controller, Subject, Time, purpose_of_processing(Purpose, Data)))) , (((~ already_has(Subject, legal_basis(LegalBasis, Purpose))) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data))) O> communicate_at_time(Controller, Subject, Time, legal_basis(LegalBasis, Purpose)))) , ((((~ already_has(Subject, legitimate_interest_third_party_or(Party,Controller))) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data))) , justification_based(Justification, article_6_1)) O> communicate_at_time(Controller, Subject, Time, legitimate_interest_third_party_or(Party,Controller)))) , ((((~ already_has(Subject, recepients_of_data(Recipients))) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data))) , recipients_personal_data(Recipients, Data)) O> communicate_at_time(Controller, Subject, Time, recepients_of_data(Recipients)))) , ((((~ already_has(Subject, information_of_transfer(Controller, Data, Country, Information))) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data))) , intent_transfer_data_to(Controller, Data, Country)) O> communicate_at_time(Controller, Subject, Time, information_of_transfer(Controller, Data, Country, Information)))) , ((((~ already_has(Subject, appropriate_safeguards(Controller, Data, Country, SafeGuards))) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data))) , transfer_relates_to(Controller, Data, Country, article_46_47_p2_article_49_1)) O> communicate_at_time(Controller, Subject, Time, appropriate_safeguards(Controller, Data, Country, SafeGuards))))'
      let res = '(all Subject__var:all Controller__var:all Processor__var:all Data__var:all Time__var:all Justification__var:all Purpose__var:all Representive__var:all DPO__var:all LegalBasis__var:all Party__var:all Recipients__var:all Country__var:all Information__var:all SafeGuards__var:(((((((((((((~ already_has(Subject__var,contact_details(Controller__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))) => ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,contact_details(Controller__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,contact_details(Controller__var))))),((# 1^d: ((# 1^d: ((~ already_has(Subject__var,contact_details(Controller__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var)))), (# 2^d: ~ ((~ already_has(Subject__var,contact_details(Controller__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var)))))) => (# 1^d: ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,contact_details(Controller__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,contact_details(Controller__var)))))))),((((((~ already_has(Subject__var,contact_details(Representive__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),representive(Controller__var,Representive__var)) => ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,contact_details(Representive__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,contact_details(Representive__var))))),((# 1^d: ((# 1^d: (((~ already_has(Subject__var,contact_details(Representive__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),representive(Controller__var,Representive__var))), (# 2^d: ~ (((~ already_has(Subject__var,contact_details(Representive__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),representive(Controller__var,Representive__var))))) => (# 1^d: ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,contact_details(Representive__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,contact_details(Representive__var))))))))),((((((~ already_has(Subject__var,contact_details(DPO__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),data_protection_officer(DPO__var,Data__var)) => ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,contact_details(DPO__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,contact_details(DPO__var))))),((# 1^d: ((# 1^d: (((~ already_has(Subject__var,contact_details(DPO__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),data_protection_officer(DPO__var,Data__var))), (# 2^d: ~ (((~ already_has(Subject__var,contact_details(DPO__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),data_protection_officer(DPO__var,Data__var))))) => (# 1^d: ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,contact_details(DPO__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,contact_details(DPO__var))))))))),(((((~ already_has(Subject__var,purpose_of_processing(Purpose__var,Data__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))) => ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,purpose_of_processing(Purpose__var,Data__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,purpose_of_processing(Purpose__var,Data__var))))),((# 1^d: ((# 1^d: ((~ already_has(Subject__var,purpose_of_processing(Purpose__var,Data__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var)))), (# 2^d: ~ ((~ already_has(Subject__var,purpose_of_processing(Purpose__var,Data__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var)))))) => (# 1^d: ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,purpose_of_processing(Purpose__var,Data__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,purpose_of_processing(Purpose__var,Data__var))))))))),(((((~ already_has(Subject__var,legal_basis(LegalBasis__var,Purpose__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))) => ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,legal_basis(LegalBasis__var,Purpose__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,legal_basis(LegalBasis__var,Purpose__var))))),((# 1^d: ((# 1^d: ((~ already_has(Subject__var,legal_basis(LegalBasis__var,Purpose__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var)))), (# 2^d: ~ ((~ already_has(Subject__var,legal_basis(LegalBasis__var,Purpose__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var)))))) => (# 1^d: ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,legal_basis(LegalBasis__var,Purpose__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,legal_basis(LegalBasis__var,Purpose__var))))))))),((((((~ already_has(Subject__var,legitimate_interest_third_party_or(Party__var,Controller__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),justification_based(Justification__var,article_6_1)) => ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,legitimate_interest_third_party_or(Party__var,Controller__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,legitimate_interest_third_party_or(Party__var,Controller__var))))),((# 1^d: ((# 1^d: (((~ already_has(Subject__var,legitimate_interest_third_party_or(Party__var,Controller__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),justification_based(Justification__var,article_6_1))), (# 2^d: ~ (((~ already_has(Subject__var,legitimate_interest_third_party_or(Party__var,Controller__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),justification_based(Justification__var,article_6_1))))) => (# 1^d: ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,legitimate_interest_third_party_or(Party__var,Controller__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,legitimate_interest_third_party_or(Party__var,Controller__var))))))))),((((((~ already_has(Subject__var,recepients_of_data(Recipients__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),recipients_personal_data(Recipients__var,Data__var)) => ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,recepients_of_data(Recipients__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,recepients_of_data(Recipients__var))))),((# 1^d: ((# 1^d: (((~ already_has(Subject__var,recepients_of_data(Recipients__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),recipients_personal_data(Recipients__var,Data__var))), (# 2^d: ~ (((~ already_has(Subject__var,recepients_of_data(Recipients__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),recipients_personal_data(Recipients__var,Data__var))))) => (# 1^d: ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,recepients_of_data(Recipients__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,recepients_of_data(Recipients__var))))))))),((((((~ already_has(Subject__var,information_of_transfer(Controller__var,Data__var,Country__var,Information__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),intent_transfer_data_to(Controller__var,Data__var,Country__var)) => ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,information_of_transfer(Controller__var,Data__var,Country__var,Information__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,information_of_transfer(Controller__var,Data__var,Country__var,Information__var))))),((# 1^d: ((# 1^d: (((~ already_has(Subject__var,information_of_transfer(Controller__var,Data__var,Country__var,Information__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),intent_transfer_data_to(Controller__var,Data__var,Country__var))), (# 2^d: ~ (((~ already_has(Subject__var,information_of_transfer(Controller__var,Data__var,Country__var,Information__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),intent_transfer_data_to(Controller__var,Data__var,Country__var))))) => (# 1^d: ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,information_of_transfer(Controller__var,Data__var,Country__var,Information__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,information_of_transfer(Controller__var,Data__var,Country__var,Information__var))))))))),((((((~ already_has(Subject__var,appropriate_safeguards(Controller__var,Data__var,Country__var,SafeGuards__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),transfer_relates_to(Controller__var,Data__var,Country__var,article_46_47_p2_article_49_1)) => ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,appropriate_safeguards(Controller__var,Data__var,Country__var,SafeGuards__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,appropriate_safeguards(Controller__var,Data__var,Country__var,SafeGuards__var))))),((# 1^d: ((# 1^d: (((~ already_has(Subject__var,appropriate_safeguards(Controller__var,Data__var,Country__var,SafeGuards__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),transfer_relates_to(Controller__var,Data__var,Country__var,article_46_47_p2_article_49_1))), (# 2^d: ~ (((~ already_has(Subject__var,appropriate_safeguards(Controller__var,Data__var,Country__var,SafeGuards__var))),(((((processor(Processor__var),nominate(Controller__var,Processor__var)),personal_data_processed(Processor__var,Data__var,Time__var,Justification__var,Purpose__var)),personal_data(Data__var,Subject__var)),data_subject(Subject__var)),controller(Controller__var,Data__var))),transfer_relates_to(Controller__var,Data__var,Country__var,article_46_47_p2_article_49_1))))) => (# 1^d: ((# 1^d: communicate_at_time(Controller__var,Subject__var,Time__var,appropriate_safeguards(Controller__var,Data__var,Country__var,SafeGuards__var))), (# 2^d: ~ communicate_at_time(Controller__var,Subject__var,Time__var,appropriate_safeguards(Controller__var,Data__var,Country__var,SafeGuards__var))))))))))'
      assert.equal(parser.parseFormula(f), res);
    done();
  });
})

